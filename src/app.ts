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
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { queueManager, QUEUE_NAMES } from './queue/QueueManager';

export const createApp = (): Application => {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body parsing / compression ────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  // ── HTTP logging ──────────────────────────────────────────────────────────
  if (config.app.env !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  // ── Health & docs ─────────────────────────────────────────────────────────
  app.get('/health', healthCheck);
  app.get('/ready', healthCheck);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(
      queueManager.getQueue(QUEUE_NAMES.NOTIFICATION)
    ),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api', router);

  // ── Error handling ────────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
