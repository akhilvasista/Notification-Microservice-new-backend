import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

const safeEqual = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

/**
 * Protect the browser-based Bull Board UI with dedicated HTTP Basic Auth.
 * Production startup validates that these credentials are configured.
 */
export const queueDashboardAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username, password } = config.queueDashboard;
  if (!username || !password) {
    res.status(503).send('Queue dashboard authentication is not configured');
    return;
  }

  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Queue Dashboard", charset="UTF-8"');
    res.status(401).send('Authentication required');
    return;
  }

  const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator < 0) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Queue Dashboard", charset="UTF-8"');
    res.status(401).send('Invalid credentials');
    return;
  }

  const providedUsername = decoded.slice(0, separator);
  const providedPassword = decoded.slice(separator + 1);

  if (
    !safeEqual(providedUsername, username) ||
    !safeEqual(providedPassword, password)
  ) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Queue Dashboard", charset="UTF-8"');
    res.status(401).send('Invalid credentials');
    return;
  }

  next();
};
