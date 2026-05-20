import { Request, Response, NextFunction } from 'express';
import { EventProcessor } from '../events/EventProcessor';
import { EventPayload } from '../events/EventTypes';
import { logger } from '../utils/logger';
import { generateId } from '../utils/helpers';

export class EventController {
  constructor(private eventProcessor: EventProcessor) {}

  /**
   * @swagger
   * /api/events/emit:
   *   post:
   *     summary: Emit a notification event
   *     tags: [Events]
   */
  emit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload: EventPayload = {
        ...req.body,
        eventId: req.body.eventId || generateId(),
      };

      // Process asynchronously - don't await to keep API responsive
      this.eventProcessor.process(payload).catch((err) =>
        logger.error({ err, event: payload.event }, 'Async event processing failed')
      );

      res.status(202).json({
        success: true,
        message: 'Event accepted for processing',
        data: { eventId: payload.eventId },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/events/emit/sync:
   *   post:
   *     summary: Emit event and wait for processing
   *     tags: [Events]
   */
  emitSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload: EventPayload = {
        ...req.body,
        eventId: req.body.eventId || generateId(),
      };

      await this.eventProcessor.process(payload);

      res.status(200).json({
        success: true,
        message: 'Event processed',
        data: { eventId: payload.eventId },
      });
    } catch (error) {
      next(error);
    }
  };
}
