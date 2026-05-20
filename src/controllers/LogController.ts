import { Request, Response, NextFunction } from 'express';
import { NotificationLogService } from '../services/NotificationLogService';
import { NotificationLog } from '../models/NotificationLog';
import { queueManager, QUEUE_NAMES } from '../queue/QueueManager';
import { Scheduler } from '../scheduler/Scheduler';
import { NotFoundError } from '../utils/errors';

const logService = new NotificationLogService();
const scheduler = new Scheduler();

export class LogController {
  getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, event, channel, status, from, to, page, limit } = req.query;
      const result = await logService.getLogs({
        userId: userId as string,
        event: event as string,
        channel: channel as string,
        status: status as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();
      const metrics = await logService.getMetrics(fromDate, toDate);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  };

  getQueueMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [notificationMetrics, bulkMetrics] = await Promise.all([
        queueManager.getQueueMetrics(QUEUE_NAMES.NOTIFICATION),
        queueManager.getQueueMetrics(QUEUE_NAMES.BULK_NOTIFICATION),
      ]);
      res.json({ success: true, data: { notification: notificationMetrics, bulk: bulkMetrics } });
    } catch (error) {
      next(error);
    }
  };

  retryFailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { logId } = req.params;
      const log = await NotificationLog.findById(logId);
      if (!log) throw new NotFoundError('Notification log');

      if (log.status !== 'failed') {
        res.status(400).json({ success: false, error: { message: 'Only failed notifications can be retried' } });
        return;
      }

      // Re-queue the notification
      await scheduler.scheduleInstant({
        userId: log.userId,
        event: log.event,
        channels: [log.channel],
        templateIds: { [log.channel]: log.templateId || '' } as { email?: string; push?: string; sms?: string },
        priority: 'normal',
        context: (log.metadata as Record<string, unknown>) || {},
      });

      await NotificationLog.findByIdAndUpdate(logId, { status: 'retrying' });

      res.json({ success: true, message: 'Notification queued for retry' });
    } catch (error) {
      next(error);
    }
  };
}
