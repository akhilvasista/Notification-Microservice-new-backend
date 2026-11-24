import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { config } from '../config';
import { QUEUE_NAMES } from '../queue/QueueManager';
import { JobPayload } from '../scheduler/Scheduler';
import { TemplateEngine } from '../templates/TemplateEngine';
import { NotificationDispatcher } from '../dispatchers/NotificationDispatcher';
import { IdempotencyService } from '../services/IdempotencyService';
import { UserContextService } from '../services/UserContextService';
import { NotificationLogService } from '../services/NotificationLogService';
import { generateIdempotencyKey } from '../utils/helpers';
import { logger } from '../utils/logger';

export class NotificationWorker {
  private worker: Worker;
  private templateEngine: TemplateEngine;
  private dispatcher: NotificationDispatcher;
  private idempotency: IdempotencyService;
  private userContext: UserContextService;
  private logService: NotificationLogService;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.dispatcher = new NotificationDispatcher();
    this.idempotency = new IdempotencyService();
    this.userContext = new UserContextService();
    this.logService = new NotificationLogService();

    this.worker = new Worker(
      QUEUE_NAMES.NOTIFICATION,
      async (job: Job<JobPayload>) => this.process(job),
      {
        connection: getRedisClient(),
        concurrency: config.queue.concurrency,
        limiter: { max: 100, duration: 1000 },
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, event: job.data.event }, 'Job completed');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, event: job?.data.event, err }, 'Job failed');
    });
  }

  private async process(job: Job<JobPayload>): Promise<void> {
    const { userId, event, eventId, channels, templateIds, stopConditions, fallback, context } = job.data;
    const childLogger = logger.child({ jobId: job.id, event, userId });

    childLogger.info('Worker executing job');

    // Step 6: Check stop conditions
    if (stopConditions && Object.keys(stopConditions).length > 0) {
      const stopped = await this.userContext.checkStopCondition(userId, stopConditions);
      if (stopped) {
        childLogger.info('Stop condition met, skipping notification');
        return;
      }
    }

    // Step 7: Build full context
    const fullContext = await this.userContext.buildContext(userId, context);

    // Process each channel
    for (const channel of channels) {
      const templateId = templateIds[channel];
      if (!templateId) continue;

      const idemKey = generateIdempotencyKey(userId, event, channel, templateId, eventId);

      // Render before claiming so template errors do not hold a delivery claim.
      const rendered = await this.templateEngine.render(templateId, fullContext);
      const claim = await this.idempotency.claim(userId, event, channel, templateId, eventId);

      if (!claim.claimed || !claim.claimToken) {
        childLogger.info({ channel }, 'Notification already claimed or processed; skipping');
        await this.logService.createLog({
          userId, event, channel, templateId,
          status: 'skipped', idempotencyKey: idemKey, jobId: job.id,
        });
        continue;
      }

      try {
        const result = await this.dispatcher.dispatch({
          userId,
          channel,
          userEmail: fullContext.email as string,
          userPhone: fullContext.phone as string,
          subject: rendered.subject,
          body: rendered.body,
          title: rendered.title,
          data: { event, type: event },
        });

        if (result.success) {
          // Persist the completed claim immediately after provider success.
          // If this write fails, retain the lease and fail the job rather than
          // immediately releasing a key after a potentially successful send.
          await this.idempotency.markProcessed(
            userId, event, channel, templateId, claim.claimToken, eventId
          );

          await this.logService.createLog({
            userId, event, channel, templateId,
            status: 'sent', idempotencyKey: idemKey, jobId: job.id,
            providerResponse: result.providerResponse,
            sentAt: new Date(),
          } as Parameters<typeof this.logService.createLog>[0] & { sentAt: Date });

          childLogger.info({ channel }, 'Notification sent successfully');
        } else {
          await this.logService.createLog({
            userId, event, channel, templateId,
            status: 'failed', idempotencyKey: idemKey, jobId: job.id,
            errorMessage: result.error,
          });

          // The dispatcher reports a failed delivery; release this claim so
          // BullMQ retry can attempt it again.
          await this.idempotency.releaseClaim(
            userId, event, channel, templateId, claim.claimToken, eventId
          );

          childLogger.warn({ channel, error: result.error }, 'Channel dispatch failed');

          if (channel === 'push' && fallback?.sms && templateIds.sms) {
            childLogger.info('Attempting SMS fallback after push failure');
            await this.handleFallback(userId, event, templateIds.sms, fullContext, job.id || '');
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        childLogger.error({ channel, error: errorMsg }, 'Notification dispatch error');

        await this.logService.createLog({
          userId, event, channel, templateId,
          status: 'failed', idempotencyKey: idemKey, jobId: job.id,
          errorMessage: errorMsg, attempt: (job.attemptsMade || 0) + 1,
        });

        // Do not release on an unexpected exception: delivery may have reached
        // the provider. The claim lease prevents immediate concurrent retries.
        throw error;
      }
    }
  }

  private async handleFallback(
    userId: string,
    event: string,
    smsTemplateId: string,
    context: Record<string, unknown>,
    jobId: string
  ): Promise<void> {
    try {
      const rendered = await this.templateEngine.render(smsTemplateId, context);
      const idemKey = generateIdempotencyKey(userId, event, 'sms', smsTemplateId, 'fallback');

      const result = await this.dispatcher.dispatch({
        userId, channel: 'sms',
        userPhone: context.phone as string,
        body: rendered.body,
      });

      await this.logService.createLog({
        userId, event, channel: 'sms', templateId: smsTemplateId,
        status: result.success ? 'sent' : 'failed',
        idempotencyKey: idemKey, jobId,
        metadata: { isFallback: true },
      });
    } catch (error) {
      logger.error({ error, userId }, 'Fallback SMS also failed');
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
