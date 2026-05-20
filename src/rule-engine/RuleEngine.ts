import { NotificationConfig } from '../models/NotificationConfig';
import { EventPayload, EventType } from '../events/EventTypes';
import { Scheduler } from '../scheduler/Scheduler';
import { logger } from '../utils/logger';
import { parseDelay, calculateReminderTimes } from '../utils/helpers';

type AnyRecord = Record<string, unknown>;

export class RuleEngine {
  private scheduler: Scheduler;

  constructor(scheduler: Scheduler) {
    this.scheduler = scheduler;
  }

  async evaluate(payload: EventPayload): Promise<void> {
    const configs = await NotificationConfig.find({ event: payload.event, isActive: true });
    if (configs.length === 0) {
      logger.debug({ event: payload.event }, 'No active configs found');
      return;
    }
    logger.info({ event: payload.event, configCount: configs.length }, 'Evaluating configs');

    for (const config of configs) {
      try {
        const p = payload as unknown as AnyRecord;
        if (!this.evaluateConditions(config.conditions as AnyRecord, p)) {
          logger.debug({ event: payload.event, configId: String(config._id) }, 'Conditions not met');
          continue;
        }

        if (payload.event === EventType.APPOINTMENT_BOOKED) {
          await this.handleAppointmentReminders(config as unknown as AnyRecord, p);
          continue;
        }

        await this.scheduleFromConfig(config as unknown as AnyRecord, p, payload.userId, payload.event);
      } catch (err) {
        logger.error({ err, configId: String(config._id) }, 'Config processing error');
      }
    }
  }

  evaluateConditions(conditions: AnyRecord, payload: AnyRecord): boolean {
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = (payload.metadata as AnyRecord)?.[key] ?? payload[key];
      if (actual !== expected) return false;
    }
    return true;
  }

  private buildContext(payload: AnyRecord): AnyRecord {
    const { event, timestamp, ...rest } = payload;
    return rest;
  }

  private async scheduleFromConfig(
    config: AnyRecord,
    payload: AnyRecord,
    userId: string,
    event: string
  ): Promise<void> {
    const schedule = config.schedule as AnyRecord;
    const repeat = config.repeat as { count: number; frequency: string } | undefined;
    const channels = config.channels as ('email' | 'push' | 'sms')[];
    const templateIds = config.templateIds as { email?: string; push?: string; sms?: string };

    const jobPayload = {
      userId,
      event,
      eventId: payload.eventId as string | undefined,
      channels,
      templateIds,
      stopConditions: config.stopConditions as AnyRecord | undefined,
      fallback: config.fallback as { sms?: boolean; email?: boolean; push?: boolean } | undefined,
      priority: (config.priority as string) || 'normal',
      context: this.buildContext(payload),
      configId: String(config._id),
    };

    const scheduleType = schedule.type as string;

    if (scheduleType === 'instant') {
      await this.scheduler.scheduleInstant(jobPayload);
    } else if (scheduleType === 'delayed') {
      const delay = schedule.delay as string | undefined;
      const delayMs = delay ? parseDelay(delay) : 0;
      if (repeat && repeat.count > 0) {
        await this.scheduler.scheduleRepeating(jobPayload, delayMs, repeat as { count: number; frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' });
      } else {
        await this.scheduler.scheduleDelayed(jobPayload, delayMs);
      }
    } else if (scheduleType === 'cron') {
      const expr = schedule.cronExpression as string;
      if (expr) await this.scheduler.scheduleCron(jobPayload, expr);
    }
  }

  private async handleAppointmentReminders(config: AnyRecord, payload: AnyRecord): Promise<void> {
    const appointmentDate = payload.appointmentDate as string | undefined;
    if (!appointmentDate) return;

    const apptDate = new Date(appointmentDate);
    const now = Date.now();
    const { minus3Days, minus1Day, minus3Hours } = calculateReminderTimes(apptDate);

    const reminders = [
      { type: 'T-3DAYS', at: minus3Days, label: 'Screening in 3 days' },
      { type: 'T-1DAY', at: minus1Day, label: 'Screening is tomorrow' },
      { type: 'T-3HOURS', at: minus3Hours, label: 'Screening is today in 3 hours' },
    ];

    for (const r of reminders) {
      const delayMs = r.at.getTime() - now;
      if (delayMs <= 0) continue;

      const jobPayload = {
        userId: payload.userId as string,
        event: EventType.SCREENING_REMINDER,
        eventId: `${payload.eventId as string}:${r.type}`,
        channels: config.channels as ('email' | 'push' | 'sms')[],
        templateIds: config.templateIds as { email?: string; push?: string; sms?: string },
        stopConditions: config.stopConditions as AnyRecord | undefined,
        fallback: config.fallback as { sms?: boolean; email?: boolean; push?: boolean } | undefined,
        priority: (config.priority as string) || 'normal',
        context: { ...this.buildContext(payload), reminderType: r.type, reminderLabel: r.label },
        configId: String(config._id),
      };

      await this.scheduler.scheduleDelayed(jobPayload, delayMs);
      logger.info({ reminderType: r.type, userId: payload.userId }, 'Reminder scheduled');
    }
  }
}
