import crypto from 'crypto';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { generateIdempotencyKey } from '../utils/helpers';
import { logger } from '../utils/logger';

const CLAIM_LEASE_MS = 60 * 60 * 1000;

export interface IdempotencyClaim {
  claimed: boolean;
  claimToken?: string;
}

export class IdempotencyService {
  /**
   * Atomically reserve a notification key before dispatch.
   * A unique index prevents concurrent workers from acquiring the same key.
   * Expired or legacy processing claims can be reclaimed after a worker crash.
   */
  async claim(
    userId: string,
    event: string,
    channel: string,
    templateId: string,
    suffix?: string
  ): Promise<IdempotencyClaim> {
    const key = generateIdempotencyKey(userId, event, channel, templateId, suffix);
    const claimToken = crypto.randomUUID();
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + CLAIM_LEASE_MS);

    try {
      await IdempotencyKey.create({
        key,
        userId,
        event,
        channel,
        status: 'processing',
        claimToken,
        leaseUntil,
      });

      return { claimed: true, claimToken };
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) {
        logger.error({ error, key }, 'Failed to reserve idempotency key');
        throw error;
      }
    }

    // Only an expired claim (or a legacy claim without a lease) may be taken over.
    const reclaimed = await IdempotencyKey.findOneAndUpdate(
      {
        key,
        status: 'processing',
        $or: [
          { leaseUntil: { $lte: now } },
          { leaseUntil: { $exists: false } },
        ],
      },
      {
        $set: { userId, event, channel, claimToken, leaseUntil },
      },
      { new: true, runValidators: true }
    );

    if (!reclaimed) {
      logger.debug({ key, userId, event, channel }, 'Notification already claimed or processed');
      return { claimed: false };
    }

    return { claimed: true, claimToken };
  }

  /**
   * Complete only the claim owned by this worker.
   */
  async markProcessed(
    userId: string,
    event: string,
    channel: string,
    templateId: string,
    claimToken: string,
    suffix?: string
  ): Promise<void> {
    const key = generateIdempotencyKey(userId, event, channel, templateId, suffix);
    const result = await IdempotencyKey.updateOne(
      { key, status: 'processing', claimToken },
      {
        $set: { status: 'processed' },
        $unset: { claimToken: 1, leaseUntil: 1 },
      }
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Idempotency claim ownership was lost before completion');
    }
  }

  /**
   * Release a claim only when delivery did not succeed and this worker still owns it.
   */
  async releaseClaim(
    userId: string,
    event: string,
    channel: string,
    templateId: string,
    claimToken: string,
    suffix?: string
  ): Promise<void> {
    const key = generateIdempotencyKey(userId, event, channel, templateId, suffix);
    await IdempotencyKey.deleteOne({ key, status: 'processing', claimToken });
  }
}
