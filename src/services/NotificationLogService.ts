import { NotificationLog, INotificationLog, NotificationStatus } from '../models/NotificationLog';
import { NotificationMetric } from '../models/NotificationMetric';
import { logger } from '../utils/logger';

export class NotificationLogService {
  async createLog(data: {
    userId: string;
    event: string;
    channel: 'email' | 'push' | 'sms';
    templateId?: string;
    status: NotificationStatus;
    idempotencyKey: string;
    jobId?: string;
    attempt?: number;
    errorMessage?: string;
    providerResponse?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<INotificationLog> {
    const log = await NotificationLog.create({
      ...data,
      sentAt: data.status === 'sent' ? new Date() : undefined,
    });
    await this.updateMetrics(data.event, data.channel, data.status);
    return log;
  }

  async updateLog(
    id: string,
    update: Partial<{
      status: NotificationStatus;
      errorMessage: string;
      providerResponse: Record<string, unknown>;
      attempt: number;
      sentAt: Date;
    }>
  ): Promise<void> {
    await NotificationLog.findByIdAndUpdate(id, update);
  }

  async getLogs(filters: {
    userId?: string;
    event?: string;
    channel?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const query: Record<string, unknown> = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.event) query.event = filters.event;
    if (filters.channel) query.channel = filters.channel;
    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.createdAt = {
        ...(filters.from && { $gte: filters.from }),
        ...(filters.to && { $lte: filters.to }),
      };
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      NotificationLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationLog.countDocuments(query),
    ]);

    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  private async updateMetrics(
    event: string,
    channel: 'email' | 'push' | 'sms',
    status: NotificationStatus
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const field = status === 'sent' ? 'sent' : status === 'failed' ? 'failed' : status === 'skipped' ? 'skipped' : 'retried';

    try {
      await NotificationMetric.findOneAndUpdate(
        { date, event, channel },
        { $inc: { [field]: 1 } },
        { upsert: true }
      );
    } catch (error) {
      logger.error({ error }, 'Failed to update metrics');
    }
  }

  async getMetrics(from: Date, to: Date) {
    return NotificationMetric.find({
      date: {
        $gte: from.toISOString().split('T')[0],
        $lte: to.toISOString().split('T')[0],
      },
    }).lean();
  }
}
