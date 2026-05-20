import { IdempotencyKey } from '../models/IdempotencyKey';
import { generateIdempotencyKey } from '../utils/helpers';
import { logger } from '../utils/logger';

export class IdempotencyService {
  /**
   * Check if a notification has already been processed.
   * Returns true if it's a duplicate (should skip).
   */
  async isDuplicate(
    userId: string,
    event: string,
    channel: string,
    templateId: string,
    suffix?: string
  ): Promise<boolean> {
    const key = generateIdempotencyKey(userId, event, channel, templateId, suffix);

    try {
      const existing = await IdempotencyKey.findOne({ key });
      if (existing) {
        logger.debug({ key, userId, event, channel }, 'Duplicate notification detected');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Mark a notification as processed
   */
  async markProcessed(
    userId: string,
    event: string,
    channel: string,
    templateId: string,
    suffix?: string
  ): Promise<void> {
    const key = generateIdempotencyKey(userId, event, channel, templateId, suffix);

    try {
      await IdempotencyKey.findOneAndUpdate(
        { key },
        { key, userId, event, channel, status: 'processed' },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error({ error, key }, 'Failed to mark idempotency key');
    }
  }
}
