import { NotificationConfig, ISchedule } from '../models/NotificationConfig';
import { EventPayload, EventType } from '../events/EventTypes';
import { IRepeat, Scheduler } from '../scheduler/Scheduler';
import { logger } from '../utils/logger';
import { calculateReminderTimes, parseDelay } from '../utils/helpers';

type AnyRecord = Record<string, unknown>;

export class RuleEngine {
  constructor(private readonly scheduler: Scheduler) {}

  async evaluate(payload: EventPayload): Promise<void> {
    const configs = await NotificationConfig.find({
      event: payload.event,
      isActive: true,
    });

    if (configs.length === 0) {
      logger.debug({ event: payload.event }, 'No active configs found');
      return;
    }

    logger.info(
      { event: payload.event, configCount: configs.length },
      'Evaluating notification configurations'
    );

    for (const notificationConfig of configs) {
      try {
        const eventData = payload as unknown as AnyRecord;
        if (!this.evaluateConditions(notificationConfig.conditions as AnyRecord, eventData)) {
          logger.debug(
            { event: payload.event, configId: String(notificationConfig._id) },
            'Notification conditions were not met'
          );
          continue;
        }

        if (payload.event === EventType.APPOINTMENT_BOOKED) {
          await this.scheduleAppointmentReminders(
            notificationConfig as unknown as AnyRecord,
            eventData
          );
          continue;
        }

        await this.scheduleFromConfig(
          notificationConfig as unknown as AnyRecord,
          eventData,
          payload.userId,
          payload.event
        );
      } catch (error) {
        logger.error(
          { error, configId: String(notificationConfig._id), event: payload.event },
          'Failed to process notification configuration'
        );
      }
    }
  }

  evaluateConditions(conditions: AnyRecord, payload: AnyRecord): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const metadata = payload.metadata as AnyRecord | undefined;
      const actualValue = metadata?.[key] ?? payload[key];

      if (actualValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  private buildContext(payload: AnyRecord): AnyRecord {
    const context = { ...payload };
    delete context.event;
    delete context.timestamp;
    return context;
  }

  private async scheduleFromConfig(
    notificationConfig: AnyRecord,
    payload: AnyRecord,
    userId: string,
    event: string
  ): Promise<void> {
    const schedule = notificationConfig.schedule as AnyRecord;
    const channels = notificationConfig.channels as ('email' | 'push' | 'sms' | 'inapp')[];
    const templateIds = notificationConfig.templateIds as {
      email?: string;
      push?: string;
      sms?: string;
      inapp?: string;
    };

    const jobPayload = {
      userId,
      event,
      eventId: payload.eventId as string | undefined,
      channels,
      templateIds,
      stopConditions: notificationConfig.stopConditions as AnyRecord | undefined,
      fallback: notificationConfig.fallback as {
        sms?: boolean;
        email?: boolean;
        push?: boolean;
      } | undefined,
      priority: (notificationConfig.priority as string) || 'normal',
      context: this.buildContext(payload),
      configId: String(notificationConfig._id),
    };

    const scheduleType = schedule.type as string;

    if (scheduleType === 'instant') {
      await this.scheduler.scheduleInstant(jobPayload);
      return;
    }

    if (scheduleType === 'delayed') {
      const delay = schedule.delay as string | undefined;
      const delayMs = delay ? parseDelay(delay) : 0;
      const repeat = notificationConfig.repeat as IRepeat | undefined;

      if (repeat && repeat.count > 0) {
        await this.scheduler.scheduleRepeating(jobPayload, delayMs, repeat);
      } else {
        await this.scheduler.scheduleDelayed(jobPayload, delayMs);
      }
      return;
    }

    if (scheduleType === 'scheduled') {
      await this.scheduler.scheduleCampaign(
        jobPayload,
        notificationConfig.schedule as ISchedule
      );
      return;
    }

    logger.warn(
      { scheduleType, event, configId: String(notificationConfig._id) },
      'Unsupported notification schedule type'
    );
  }

  private async scheduleAppointmentReminders(
    notificationConfig: AnyRecord,
    payload: AnyRecord
  ): Promise<void> {
    const appointmentDate = payload.appointmentDate as string | undefined;
    if (!appointmentDate) {
      logger.warn(
        { userId: payload.userId },
        'Appointment event did not include an appointment date'
      );
      return;
    }

    const appointment = new Date(appointmentDate);
    if (Number.isNaN(appointment.getTime())) {
      logger.warn(
        { userId: payload.userId, appointmentDate },
        'Appointment event included an invalid appointment date'
      );
      return;
    }

    const now = Date.now();
    const reminderTimes = calculateReminderTimes(appointment);
    const reminders = [
      { type: 'T-3DAYS', at: reminderTimes.minus3Days, label: 'Screening in 3 days' },
      { type: 'T-1DAY', at: reminderTimes.minus1Day, label: 'Screening is tomorrow' },
      { type: 'T-3HOURS', at: reminderTimes.minus3Hours, label: 'Screening is today in 3 hours' },
    ];

    for (const reminder of reminders) {
      const delayMs = reminder.at.getTime() - now;
      if (delayMs <= 0) {
        continue;
      }

      const jobPayload = {
        userId: payload.userId as string,
        event: EventType.SCREENING_REMINDER,
        eventId: String(payload.eventId) + ':' + reminder.type,
        channels: notificationConfig.channels as ('email' | 'push' | 'sms')[],
        templateIds: notificationConfig.templateIds as {
          email?: string;
          push?: string;
          sms?: string;
        },
        stopConditions: notificationConfig.stopConditions as AnyRecord | undefined,
        fallback: notificationConfig.fallback as {
          sms?: boolean;
          email?: boolean;
          push?: boolean;
        } | undefined,
        priority: (notificationConfig.priority as string) || 'normal',
        context: {
          ...this.buildContext(payload),
          reminderType: reminder.type,
          reminderLabel: reminder.label,
        },
        configId: String(notificationConfig._id),
      };

      await this.scheduler.scheduleDelayed(jobPayload, delayMs);
      logger.info(
        { reminderType: reminder.type, userId: payload.userId },
        'Appointment reminder scheduled'
      );
    }
  }
}
