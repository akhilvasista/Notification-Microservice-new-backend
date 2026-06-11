// import { Queue, JobsOptions } from 'bullmq';
// import { ISchedule } from '../models/NotificationConfig';
// import { CronExpressionBuilder } from '../utils/CronExpressionBuilder';
// import { queueManager, QUEUE_NAMES } from '../queue/QueueManager';
// import { IRepeat } from '../models/NotificationConfig';
// import { logger } from '../utils/logger';
// import { generateId } from '../utils/helpers';

// export interface JobPayload {
//   userId: string;
//   event: string;
//   eventId?: string;
//   channels: ('email' | 'push' | 'sms')[];
//   templateIds: { email?: string; push?: string; sms?: string };
//   stopConditions?: Record<string, unknown>;
//   fallback?: { sms?: boolean; email?: boolean; push?: boolean };
//   priority: string;
//   context: Record<string, unknown>;
//   configId?: string;
//   attempt?: number;
// }

// export class Scheduler {
//   private get notificationQueue(): Queue {
//     return queueManager.getQueue(QUEUE_NAMES.NOTIFICATION);
//   }

//   private get bulkQueue(): Queue {
//     return queueManager.getQueue(QUEUE_NAMES.BULK_NOTIFICATION);
//   }

//   async scheduleInstant(payload: JobPayload): Promise<string> {
//     const jobId = payload.eventId || generateId();
//     await this.notificationQueue.add('send-notification', payload, {
//       jobId,
//       priority: this.getPriorityValue(payload.priority),
//     });
//     logger.info({ jobId, event: payload.event, userId: payload.userId }, 'Instant job scheduled');
//     return jobId;
//   }

//   async scheduleDelayed(payload: JobPayload, delayMs: number): Promise<string> {
//     const jobId = payload.eventId || generateId();
//     await this.notificationQueue.add('send-notification', payload, {
//       jobId,
//       delay: delayMs,
//       priority: this.getPriorityValue(payload.priority),
//     });
//     logger.info({ jobId, event: payload.event, userId: payload.userId, delayMs }, 'Delayed job scheduled');
//     return jobId;
//   }

//   async scheduleRepeating(payload: JobPayload, initialDelay: number, repeat: IRepeat): Promise<string[]> {
//     const jobIds: string[] = [];
//     const frequencyMs = this.frequencyToMs(repeat.frequency);

//     for (let i = 0; i < repeat.count; i++) {
//       const delay = initialDelay + i * frequencyMs;
//       const jobId = `${payload.eventId || generateId()}:repeat:${i + 1}`;
//       const jobPayload = { ...payload, repeatIteration: i + 1, totalRepeat: repeat.count };

//       await this.notificationQueue.add('send-notification', jobPayload, {
//         jobId,
//         delay,
//         priority: this.getPriorityValue(payload.priority),
//       });
//       jobIds.push(jobId);
//     }

//     logger.info({ count: repeat.count, event: payload.event, userId: payload.userId }, 'Repeating jobs scheduled');
//     return jobIds;
//   }

//   async scheduleCron(payload: JobPayload, cronExpression: string): Promise<string> {
//     const jobId = `cron:${payload.event}:${payload.userId}`;
//     await this.notificationQueue.add('send-notification', payload, {
//       jobId,
//       repeat: { pattern: cronExpression },
//       priority: this.getPriorityValue(payload.priority),
//     });
//     logger.info({ jobId, cronExpression, event: payload.event }, 'Cron job scheduled');
//     return jobId;
//   }

//   async scheduleBulk(payloads: JobPayload[]): Promise<void> {
//     const jobs = payloads.map((p) => ({
//       name: 'bulk-send',
//       data: p,
//       opts: { jobId: p.eventId || generateId() },
//     }));
//     await this.bulkQueue.addBulk(jobs);
//     logger.info({ count: payloads.length }, 'Bulk jobs scheduled');
//   }

//   async cancelJob(jobId: string): Promise<boolean> {
//     const job = await this.notificationQueue.getJob(jobId);
//     if (job) {
//       await job.remove();
//       logger.info({ jobId }, 'Job cancelled');
//       return true;
//     }
//     return false;
//   }

//   private getPriorityValue(priority: string): number {
//     const map: Record<string, number> = { critical: 1, high: 2, normal: 3, low: 4 };
//     return map[priority] ?? 3;
//   }

//   private frequencyToMs(frequency: string): number {
//     const map: Record<string, number> = {
//       hourly: 60 * 60 * 1000,
//       daily: 24 * 60 * 60 * 1000,
//       weekly: 7 * 24 * 60 * 60 * 1000,
//       monthly: 30 * 24 * 60 * 60 * 1000,
//     };
//     return map[frequency] ?? 24 * 60 * 60 * 1000;
//   }
// }






import { Queue } from 'bullmq';

import {
  queueManager,
  QUEUE_NAMES,
} from '../queue/QueueManager';

import { ISchedule } from '../models/NotificationConfig';

import { CronExpressionBuilder } from '../utils/CronExpressionBuilder';

export interface IRepeat {
  count: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

import { logger } from '../utils/logger';

import { generateId } from '../utils/helpers';

export interface JobPayload {
  userId: string;

  event: string;

  eventId?: string;

  channels: ('email' | 'push' | 'sms' |'inapp')[];

  templateIds: {
    email?: string;
    push?: string;
    sms?: string;
    inapp?: string;
  };

  stopConditions?: Record<string, unknown>;

  fallback?: {
    sms?: boolean;
    email?: boolean;
    push?: boolean;
  };

  priority: string;

  context: Record<string, unknown>;

  configId?: string;

  attempt?: number;
}

export class Scheduler {
  private get notificationQueue(): Queue {
    return queueManager.getQueue(
      QUEUE_NAMES.NOTIFICATION
    );
  }

  private get bulkQueue(): Queue {
    return queueManager.getQueue(
      QUEUE_NAMES.BULK_NOTIFICATION
    );
  }

  async scheduleInstant(
    payload: JobPayload
  ): Promise<string> {
    const jobId =
      payload.eventId || generateId();

    await this.notificationQueue.add(
      'send-notification',
      payload,
      {
        jobId,

        priority: this.getPriorityValue(
          payload.priority
        ),
      }
    );

    logger.info(
      {
        jobId,
        event: payload.event,
        userId: payload.userId,
      },
      'Instant job scheduled'
    );

    return jobId;
  }

  async scheduleDelayed(
    payload: JobPayload,
    delayMs: number
  ): Promise<string> {
    const jobId =
      payload.eventId || generateId();

    await this.notificationQueue.add(
      'send-notification',
      payload,
      {
        jobId,

        delay: delayMs,

        priority: this.getPriorityValue(
          payload.priority
        ),
      }
    );

    logger.info(
      {
        jobId,
        event: payload.event,
        userId: payload.userId,
        delayMs,
      },
      'Delayed job scheduled'
    );

    return jobId;
  }

  async scheduleRepeating(
    payload: JobPayload,
    initialDelay: number,
    repeat: IRepeat
  ): Promise<string[]> {
    const jobIds: string[] = [];

    const frequencyMs =
      this.frequencyToMs(repeat.frequency);

    for (let i = 0; i < repeat.count; i++) {
      const delay =
        initialDelay + i * frequencyMs;

      const jobId = `${
        payload.eventId || generateId()
      }:repeat:${i + 1}`;

      const jobPayload = {
        ...payload,
        repeatIteration: i + 1,
        totalRepeat: repeat.count,
      };

      await this.notificationQueue.add(
        'send-notification',
        jobPayload,
        {
          jobId,

          delay,

          priority: this.getPriorityValue(
            payload.priority
          ),
        }
      );

      jobIds.push(jobId);
    }

    logger.info(
      {
        count: repeat.count,
        event: payload.event,
        userId: payload.userId,
      },
      'Repeating jobs scheduled'
    );

    return jobIds;
  }

  async scheduleCron(
    payload: JobPayload,
    cronExpression: string
  ): Promise<string> {
    const jobId = `cron:${payload.event}:${payload.userId}`;

    await this.notificationQueue.add(
      'send-notification',
      payload,
      {
        jobId,

        repeat: {
          pattern: cronExpression,
        },

        priority: this.getPriorityValue(
          payload.priority
        ),
      }
    );

    logger.info(
      {
        jobId,
        cronExpression,
        event: payload.event,
      },
      'Cron job scheduled'
    );

    return jobId;
  }

  async scheduleCampaign(
    payload: JobPayload,
    schedule: ISchedule
  ): Promise<string[]> {
    if (schedule.type === 'instant') {
      const jobId =
        await this.scheduleInstant(payload);

      return [jobId];
    }

    const cronExpressions =
      schedule.cronExpression
        ? [schedule.cronExpression]
        : CronExpressionBuilder.build(
            schedule
          );

    const scheduledJobIds: string[] = [];

    for (const cron of cronExpressions) {
      const jobId = `campaign:${
        payload.event
      }:${payload.userId}:${generateId()}`;

      await this.notificationQueue.add(
        'send-notification',
        {
          ...payload,
          schedule,
        },
        {
          jobId,

          repeat: {
            pattern: cron,

            ...(schedule.startDate && {
              startDate: new Date(
                schedule.startDate
              ),
            }),

            ...(schedule.endDate && {
              endDate: new Date(
                schedule.endDate
              ),
            }),

            ...(schedule.timezone && {
              tz: schedule.timezone,
            }),
          },

          priority: this.getPriorityValue(
            payload.priority
          ),
        }
      );

      scheduledJobIds.push(jobId);

      logger.info(
        {
          jobId,
          cron,
          event: payload.event,
          userId: payload.userId,
        },
        'Scheduled recurring campaign created'
      );
    }

    return scheduledJobIds;
  }

  async scheduleBulk(
    payloads: JobPayload[]
  ): Promise<void> {
    const jobs = payloads.map((p) => ({
      name: 'bulk-send',

      data: p,

      opts: {
        jobId:
          p.eventId || generateId(),
      },
    }));

    await this.bulkQueue.addBulk(jobs);

    logger.info(
      {
        count: payloads.length,
      },
      'Bulk jobs scheduled'
    );
  }

  async cancelJob(
    jobId: string
  ): Promise<boolean> {
    const job =
      await this.notificationQueue.getJob(
        jobId
      );

    if (job) {
      await job.remove();

      logger.info(
        { jobId },
        'Job cancelled'
      );

      return true;
    }

    return false;
  }

  private getPriorityValue(
    priority: string
  ): number {
    const map: Record<string, number> = {
      critical: 1,
      high: 2,
      normal: 3,
      low: 4,
    };

    return map[priority] ?? 3;
  }

  private frequencyToMs(
    frequency: string
  ): number {
    const map: Record<string, number> = {
      hourly: 60 * 60 * 1000,

      daily:
        24 * 60 * 60 * 1000,

      weekly:
        7 * 24 * 60 * 60 * 1000,

      monthly:
        30 * 24 * 60 * 60 * 1000,
    };

    return (
      map[frequency] ??
      24 * 60 * 60 * 1000
    );
  }
}