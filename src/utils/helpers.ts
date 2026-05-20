import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique idempotency key from components
 */
export const generateIdempotencyKey = (
  userId: string,
  event: string,
  channel: string,
  templateId: string,
  suffix?: string
): string => {
  const base = `${userId}:${event}:${channel}:${templateId}${suffix ? `:${suffix}` : ''}`;
  return crypto.createHash('sha256').update(base).digest('hex');
};

/**
 * Parse delay string like "1d", "3h", "30m" into milliseconds
 */
export const parseDelay = (delay: string): number => {
  const match = delay.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid delay format: ${delay}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
};

/**
 * Calculate appointment reminder timestamps
 */
export const calculateReminderTimes = (
  appointmentDate: Date
): { minus3Days: Date; minus1Day: Date; minus3Hours: Date } => {
  const ms = appointmentDate.getTime();
  return {
    minus3Days: new Date(ms - 3 * 24 * 60 * 60 * 1000),
    minus1Day: new Date(ms - 24 * 60 * 60 * 1000),
    minus3Hours: new Date(ms - 3 * 60 * 60 * 1000),
  };
};

/**
 * Sleep utility for throttling
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate UUID
 */
export const generateId = (): string => uuidv4();

/**
 * Chunk array into batches
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Safely parse JSON
 */
export const safeJsonParse = <T>(str: string): T | null => {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
};

/**
 * Format phone number for MSG91 (Indian format)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
};

/**
 * Exponential backoff delay calculation
 */
export const exponentialBackoff = (attempt: number, baseDelay = 5000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), 300000); // max 5 min
};
