import { v4 as uuidv4 } from 'uuid';
import { EventPayload, BaseEventPayload } from './EventTypes';
import { RuleEngine } from '../rule-engine/RuleEngine';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export class EventProcessor {
  private ruleEngine: RuleEngine;

  constructor(ruleEngine: RuleEngine) {
    this.ruleEngine = ruleEngine;
  }

  /**
   * Main entry point for all events
   */
  async process(payload: EventPayload): Promise<void> {
    const childLogger = logger.child({ eventId: payload.eventId, event: payload.event, userId: payload.userId });

    try {
      childLogger.info('Processing event');

      // Validate payload
      this.validate(payload);

      // Ensure eventId for idempotency
      if (!payload.eventId) {
        (payload as BaseEventPayload).eventId = uuidv4();
      }

      // Delegate to rule engine
      await this.ruleEngine.evaluate(payload);

      childLogger.info('Event processed successfully');
    } catch (error) {
      childLogger.error({ error }, 'Event processing failed');
      throw error;
    }
  }

  private validate(payload: EventPayload): void {
    if (!payload.event) throw new ValidationError('Event type is required');
    if (!payload.userId) throw new ValidationError('userId is required');
    if (!payload.timestamp) throw new ValidationError('timestamp is required');
  }
}
