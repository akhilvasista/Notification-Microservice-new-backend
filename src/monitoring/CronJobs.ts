import cron from 'node-cron';
import { EventProcessor } from '../events/EventProcessor';
import { EventType } from '../events/EventTypes';
import { logger } from '../utils/logger';
import { generateId } from '../utils/helpers';

/**
 * CronJobs sets up all scheduled background tasks.
 */
export class CronJobs {
  private jobs: cron.ScheduledTask[] = [];

  constructor(private eventProcessor: EventProcessor) {}

  start(): void {
    // Daily gamification summary - 9 AM IST daily
    this.jobs.push(
      cron.schedule('0 9 * * *', () => this.triggerDailyGamification(), { timezone: 'Asia/Kolkata' })
    );

    // Weekly gamification summary - 9 AM IST every Monday
    this.jobs.push(
      cron.schedule('0 9 * * 1', () => this.triggerWeeklyGamification(), { timezone: 'Asia/Kolkata' })
    );

    // Inactivity check - 10 AM IST daily
    this.jobs.push(
      cron.schedule('0 10 * * *', () => this.triggerInactivityCheck(), { timezone: 'Asia/Kolkata' })
    );

    // Tele-doctor queue update - every 30 minutes during working hours
    this.jobs.push(
      cron.schedule('*/30 8-18 * * 1-6', () => this.triggerTeleDoctorQueueUpdate(), { timezone: 'Asia/Kolkata' })
    );

    logger.info({ jobCount: this.jobs.length }, 'Cron jobs started');
  }

  stop(): void {
    this.jobs.forEach((job) => job.stop());
    logger.info('Cron jobs stopped');
  }

  private async triggerDailyGamification(): Promise<void> {
    logger.info('Triggering daily gamification cron');
    // In production, fetch all active users and emit per-user events
    // This is a system-level event; individual user events would be emitted per user
    await this.eventProcessor.process({
      event: EventType.DAILY_GAMIFICATION,
      userId: 'system',
      timestamp: new Date().toISOString(),
      eventId: generateId(),
      pointsEarned: 0,
      totalPoints: 0,
    } as Parameters<typeof this.eventProcessor.process>[0]);
  }

  private async triggerWeeklyGamification(): Promise<void> {
    logger.info('Triggering weekly gamification cron');
    await this.eventProcessor.process({
      event: EventType.WEEKLY_GAMIFICATION,
      userId: 'system',
      timestamp: new Date().toISOString(),
      eventId: generateId(),
      pointsEarned: 0,
      totalPoints: 0,
    } as Parameters<typeof this.eventProcessor.process>[0]);
  }

  private async triggerInactivityCheck(): Promise<void> {
    logger.info('Triggering inactivity check cron');
    // In production: query users inactive for 15+ days and emit per-user events
  }

  private async triggerTeleDoctorQueueUpdate(): Promise<void> {
    logger.info('Triggering tele-doctor queue update');
    // In production: query current queue and emit per-role events
  }
}
