import pino from 'pino';
import { config } from '../config';
import fs from 'fs';

// Ensure log directory exists
if (!fs.existsSync(config.logging.dir)) {
  fs.mkdirSync(config.logging.dir, { recursive: true });
}

const isDev = config.app.env !== 'production';

export const logger = pino({
  name: config.app.serviceName,
  level: config.logging.level,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

export const createChildLogger = (context: Record<string, unknown>) =>
  logger.child(context);
