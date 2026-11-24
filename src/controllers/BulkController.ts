import { Response, NextFunction } from 'express';
import { Scheduler } from '../scheduler/Scheduler';
import { AuthRequest } from '../middleware/auth';
import { generateId } from '../utils/helpers';
import { logger } from '../utils/logger';

const scheduler = new Scheduler();

// In production, this would query a User microservice
const mockFetchUsers = async (_filters: Record<string, unknown>): Promise<Array<{ userId: string; email: string; phone: string }>> => {
  // Placeholder - integrate with your user service
  return [];
};

export class BulkController {
  trigger = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { templateId, channels, filters, scheduledAt } = req.body;
      const campaignId = generateId();

      // Fetch users based on filters
      const users = await mockFetchUsers(filters || {});

      if (users.length === 0) {
        res.json({ success: true, message: 'No users matched the filter criteria', data: { campaignId, userCount: 0 } });
        return;
      }

      logger.info({ campaignId, userCount: users.length, channels }, 'Bulk campaign started');

      const jobPayloads = users.flatMap((user) =>
        channels.map((channel: 'email' | 'push' | 'sms') => ({
          userId: user.userId,
          event: 'BULK_NOTIFICATION',
          channels: [channel],
          templateIds: { [channel]: templateId } as { email?: string; push?: string; sms?: string },
          priority: 'normal' as const,
          context: { email: user.email, phone: user.phone, campaignId },
          configId: campaignId,
        }))
      );

      if (scheduledAt) {
        const delayMs = new Date(scheduledAt).getTime() - Date.now();
        if (delayMs > 0) {
          await Promise.all(jobPayloads.map((p) => scheduler.scheduleDelayed(p, delayMs)));
        }
      } else {
        await scheduler.scheduleBulk(jobPayloads);
      }

      res.status(202).json({
        success: true,
        message: 'Bulk campaign queued',
        data: { campaignId, userCount: users.length, channels },
      });
    } catch (error) {
      next(error);
    }
  };
}
