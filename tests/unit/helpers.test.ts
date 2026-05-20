import {
  parseDelay,
  generateIdempotencyKey,
  calculateReminderTimes,
  chunk,
  formatPhoneNumber,
  exponentialBackoff,
} from '../../src/utils/helpers';

describe('helpers', () => {
  describe('parseDelay', () => {
    it('parses seconds', () => expect(parseDelay('30s')).toBe(30_000));
    it('parses minutes', () => expect(parseDelay('5m')).toBe(300_000));
    it('parses hours', () => expect(parseDelay('3h')).toBe(10_800_000));
    it('parses days', () => expect(parseDelay('1d')).toBe(86_400_000));
    it('throws on invalid format', () => expect(() => parseDelay('bad')).toThrow());
  });

  describe('generateIdempotencyKey', () => {
    it('generates consistent hash for same inputs', () => {
      const k1 = generateIdempotencyKey('u1', 'EVENT', 'email', 'tmpl_1');
      const k2 = generateIdempotencyKey('u1', 'EVENT', 'email', 'tmpl_1');
      expect(k1).toBe(k2);
    });

    it('generates different hash for different inputs', () => {
      const k1 = generateIdempotencyKey('u1', 'EVENT', 'email', 'tmpl_1');
      const k2 = generateIdempotencyKey('u2', 'EVENT', 'email', 'tmpl_1');
      expect(k1).not.toBe(k2);
    });

    it('includes suffix when provided', () => {
      const k1 = generateIdempotencyKey('u1', 'E', 'sms', 't1', 'suffix1');
      const k2 = generateIdempotencyKey('u1', 'E', 'sms', 't1', 'suffix2');
      expect(k1).not.toBe(k2);
    });
  });

  describe('calculateReminderTimes', () => {
    it('returns correct reminder times', () => {
      const appointment = new Date('2026-06-01T10:00:00Z');
      const { minus3Days, minus1Day, minus3Hours } = calculateReminderTimes(appointment);
      expect(minus3Days.toISOString()).toBe('2026-05-29T10:00:00.000Z');
      expect(minus1Day.toISOString()).toBe('2026-05-31T10:00:00.000Z');
      expect(minus3Hours.toISOString()).toBe('2026-06-01T07:00:00.000Z');
    });
  });

  describe('chunk', () => {
    it('chunks array correctly', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
    it('returns single chunk when size >= length', () => {
      expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
    });
    it('returns empty array for empty input', () => {
      expect(chunk([], 3)).toEqual([]);
    });
  });

  describe('formatPhoneNumber', () => {
    it('prepends 91 to 10-digit number', () => expect(formatPhoneNumber('9876543210')).toBe('919876543210'));
    it('leaves 12-digit number with 91 prefix unchanged', () => expect(formatPhoneNumber('919876543210')).toBe('919876543210'));
    it('strips non-digits', () => expect(formatPhoneNumber('+91-98765-43210')).toBe('919876543210'));
  });

  describe('exponentialBackoff', () => {
    it('returns baseDelay for attempt 1', () => expect(exponentialBackoff(1, 1000)).toBe(1000));
    it('doubles for attempt 2', () => expect(exponentialBackoff(2, 1000)).toBe(2000));
    it('caps at 5 minutes', () => expect(exponentialBackoff(100, 5000)).toBe(300_000));
  });
});
