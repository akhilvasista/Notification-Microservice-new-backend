import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  BULK_NOTIFICATION: 'bulk-notification',
  DEAD_LETTER: 'dead-letter',
  RETRY: 'retry',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  private getConnection() {
    return getRedisClient();
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.getConnection(),
        defaultJobOptions: {
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
          attempts: config.queue.maxRetries,
          backoff: {
            type: 'exponential',
            delay: config.queue.backoffDelay,
          },
        },
      });
      this.queues.set(name, queue);
      logger.info({ queue: name }, 'Queue initialized');
    }
    return this.queues.get(name)!;
  }

  getQueueEvents(name: string): QueueEvents {
    if (!this.queueEvents.has(name)) {
      const events = new QueueEvents(name, { connection: this.getConnection() });
      events.on('completed', ({ jobId }) => logger.debug({ jobId, queue: name }, 'Job completed'));
      events.on('failed', ({ jobId, failedReason }) =>
        logger.error({ jobId, failedReason, queue: name }, 'Job failed')
      );
      this.queueEvents.set(name, events);
    }
    return this.queueEvents.get(name)!;
  }

  async closeAll(): Promise<void> {
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info({ queue: name }, 'Queue closed');
    }
    for (const [, events] of this.queueEvents) {
      await events.close();
    }
  }

  async getQueueMetrics(name: string) {
    const queue = this.getQueue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { name, waiting, active, completed, failed, delayed };
  }
}

export const queueManager = new QueueManager();
