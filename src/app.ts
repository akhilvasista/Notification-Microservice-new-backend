import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { router } from './routes';
import { healthCheck } from './monitoring/HealthCheck';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';
import { config } from './config';
import { queueDashboardAuth } from './middleware/queueDashboardAuth';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { queueManager, QUEUE_NAMES } from './queue/QueueManager';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const createApp = (): Application => {
  const app = express();

  // Security headers and an explicit browser-origin allowlist.
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        const isDevelopmentWithoutAllowlist =
          config.app.env !== 'production' && allowedOrigins.length === 0;

        if (!origin || isDevelopmentWithoutAllowlist || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin is not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing and compression.
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  // Structured HTTP logging.
  if (config.app.env !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  // Health checks and API documentation.
  app.get('/health', healthCheck);
  app.get('/ready', healthCheck);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  // Protect the browser-based queue dashboard with dedicated Basic Auth credentials.
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(queueManager.getQueue(QUEUE_NAMES.NOTIFICATION))],
    serverAdapter,
  });

  app.use(
    '/admin/queues',
    queueDashboardAuth,
    serverAdapter.getRouter()
  );

  // API routes.
  app.use('/api', router);

  // Centralized error handling.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
