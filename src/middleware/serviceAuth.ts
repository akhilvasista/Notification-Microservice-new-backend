import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';

/**
 * Authenticate trusted internal callers of event-ingestion endpoints.
 *
 * Local development remains convenient when no key is configured. Production
 * startup requires a strong SERVICE_API_KEY, and requests must provide it via
 * the x-service-key header.
 */
export const authenticateService = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const expectedKey = config.serviceApiKey;

  if (!expectedKey && config.app.env !== 'production') {
    next();
    return;
  }

  const providedKey = req.header('x-service-key');
  if (!providedKey) {
    next(new UnauthorizedError('Service credentials required'));
    return;
  }

  const expected = Buffer.from(expectedKey);
  const provided = Buffer.from(providedKey);

  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    next(new UnauthorizedError('Invalid service credentials'));
    return;
  }

  next();
};
