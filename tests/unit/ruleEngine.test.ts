import { RuleEngine } from '../../src/rule-engine/RuleEngine';
import { Scheduler } from '../../src/scheduler/Scheduler';
import { EventType } from '../../src/events/EventTypes';
import { NotificationConfig } from '../../src/models/NotificationConfig';

jest.mock('../../src/models/NotificationConfig');
jest.mock('../../src/scheduler/Scheduler');

const BASE_PAYLOAD = { event: EventType.USER_SIGNED_UP, userId: 'u1', timestamp: new Date().toISOString() };

const mockInstantConfig = {
  _id: 'cfg_1',
  event: EventType.USER_SIGNED_UP,
  name: 'Test Instant Config',
  conditions: {},
  channels: ['email'],
  templateIds: { email: 'tmpl_test_email' },
  schedule: { type: 'instant' },
  stopConditions: {},
  fallback: {},
  priority: 'normal',
  isActive: true,
};

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;
  let mockScheduler: jest.Mocked<Scheduler>;

  beforeEach(() => {
    mockScheduler = new Scheduler() as jest.Mocked<Scheduler>;
    mockScheduler.scheduleInstant = jest.fn().mockResolvedValue('job_123');
    mockScheduler.scheduleDelayed = jest.fn().mockResolvedValue('job_456');
    mockScheduler.scheduleRepeating = jest.fn().mockResolvedValue(['job_1', 'job_2']);
    ruleEngine = new RuleEngine(mockScheduler);
  });

  afterEach(() => jest.clearAllMocks());

  describe('evaluateConditions', () => {
    it('returns true when no conditions defined', () => {
      expect(ruleEngine.evaluateConditions({}, BASE_PAYLOAD as Record<string, unknown>)).toBe(true);
    });

    it('returns true when all conditions match payload', () => {
      const payload = { ...BASE_PAYLOAD, childAdded: false } as Record<string, unknown>;
      expect(ruleEngine.evaluateConditions({ childAdded: false }, payload)).toBe(true);
    });

    it('returns false when condition value does not match', () => {
      const payload = { ...BASE_PAYLOAD, childAdded: true } as Record<string, unknown>;
      expect(ruleEngine.evaluateConditions({ childAdded: false }, payload)).toBe(false);
    });

    it('returns false when condition key is missing from payload', () => {
      expect(ruleEngine.evaluateConditions({ childAdded: false }, BASE_PAYLOAD as Record<string, unknown>)).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('does nothing when no active configs found', async () => {
      (NotificationConfig.find as jest.Mock).mockResolvedValue([]);
      await ruleEngine.evaluate(BASE_PAYLOAD);
      expect(mockScheduler.scheduleInstant).not.toHaveBeenCalled();
    });

    it('schedules instant job for instant config', async () => {
      (NotificationConfig.find as jest.Mock).mockResolvedValue([mockInstantConfig]);
      await ruleEngine.evaluate(BASE_PAYLOAD);
      expect(mockScheduler.scheduleInstant).toHaveBeenCalledTimes(1);
    });

    it('schedules delayed job for delayed config without repeat', async () => {
      const cfg = { ...mockInstantConfig, schedule: { type: 'delayed', delay: '1d' } };
      (NotificationConfig.find as jest.Mock).mockResolvedValue([cfg]);
      await ruleEngine.evaluate(BASE_PAYLOAD);
      expect(mockScheduler.scheduleDelayed).toHaveBeenCalledTimes(1);
    });

    it('schedules repeating jobs when repeat is configured', async () => {
      const cfg = {
        ...mockInstantConfig,
        schedule: { type: 'delayed', delay: '1d' },
        repeat: { count: 3, frequency: 'daily' },
      };
      (NotificationConfig.find as jest.Mock).mockResolvedValue([cfg]);
      await ruleEngine.evaluate(BASE_PAYLOAD);
      expect(mockScheduler.scheduleRepeating).toHaveBeenCalledTimes(1);
    });

    it('skips config when conditions are not met', async () => {
      const cfg = { ...mockInstantConfig, conditions: { childAdded: false } };
      (NotificationConfig.find as jest.Mock).mockResolvedValue([cfg]);
      // Payload has childAdded: true → condition expects false → skip
      const payload = { ...BASE_PAYLOAD, childAdded: true };
      await ruleEngine.evaluate(payload as typeof BASE_PAYLOAD);
      expect(mockScheduler.scheduleInstant).not.toHaveBeenCalled();
    });
  });
});
