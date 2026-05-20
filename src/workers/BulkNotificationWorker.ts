import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { config } from '../config';
import { QUEUE_NAMES } from '../queue/QueueManager';
import { TemplateEngine } from '../templates/TemplateEngine';
import { NotificationDispatcher } from '../dispatchers/NotificationDispatcher';
import { NotificationLogService } from '../services/NotificationLogService';
import { generateIdempotencyKey, sleep } from '../utils/helpers';
import { logger } from '../utils/logger';

interface BulkJobData {
  userId: string;
  templateId: string;
  channel: 'email' | 'push' | 'sms';
  context: Record<string, unknown>;
  adminId: string;
  campaignId: string;
}

export class BulkNotificationWorker {
  private worker: Worker;
  private templateEngine: TemplateEngine;
  private dispatcher: NotificationDispatcher;
  private logService: NotificationLogService;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.dispatcher = new NotificationDispatcher();
    this.logService = new NotificationLogService();

    this.worker = new Worker(
      QUEUE_NAMES.BULK_NOTIFICATION,
      async (job: Job<BulkJobData>) => this.process(job),
      {
        connection: getRedisClient(),
        concurrency: 2, // Lower concurrency for bulk
        limiter: { max: 50, duration: 1000 }, // Rate limit: 50/sec
      }
    );

    this.worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Bulk notification job failed');
    });
  }

  private async process(job: Job<BulkJobData>): Promise<void> {
    const { userId, templateId, channel, context, campaignId } = job.data;

    try {
      const rendered = await this.templateEngine.render(templateId, context);
      const idemKey = generateIdempotencyKey(userId, 'BULK', channel, templateId, campaignId);

      const result = await this.dispatcher.dispatch({
        userId, channel,
        userEmail: context.email as string,
        userPhone: context.phone as string,
        subject: rendered.subject,
        body: rendered.body,
        title: rendered.title,
      });

      await this.logService.createLog({
        userId, event: 'BULK_NOTIFICATION', channel, templateId,
        status: result.success ? 'sent' : 'failed',
        idempotencyKey: idemKey, jobId: job.id,
        metadata: { campaignId },
      });

      // Rate limiting: small delay between bulk sends
      await sleep(config.rateLimit.bulkDelayMs / 10);
    } catch (error) {
      logger.error({ error, userId, channel }, 'Bulk notification processing error');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
