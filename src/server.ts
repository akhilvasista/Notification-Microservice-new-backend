import 'dotenv/config';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { config } from './config';
import { logger } from './utils/logger';
import { NotificationWorker } from './workers/NotificationWorker';
import { BulkNotificationWorker } from './workers/BulkNotificationWorker';
import { CronJobs } from './monitoring/CronJobs';
import { eventProcessor } from './routes';
import { queueManager } from './queue/QueueManager';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { QUEUE_NAMES } from './queue/QueueManager';

let notificationWorker: NotificationWorker;
let bulkWorker: BulkNotificationWorker;
let cronJobs: CronJobs;

const bootstrap = async (): Promise<void> => {
  logger.info(`Starting ${config.app.serviceName} in ${config.app.env} mode`);

  // ── Connect infrastructure ─────────────────────────────────────────────
  await connectDatabase();
  await connectRedis();

  // ── Start workers ──────────────────────────────────────────────────────
  notificationWorker = new NotificationWorker();
  bulkWorker = new BulkNotificationWorker();
  logger.info('Workers started');

  // ── Start cron jobs ────────────────────────────────────────────────────
  cronJobs = new CronJobs(eventProcessor);
  if (config.app.env !== 'test') {
    cronJobs.start();
  }

  // ── Start HTTP server ──────────────────────────────────────────────────
  const app = createApp();


  const server = app.listen(config.app.port, () => {
    logger.info(`Server listening on port ${config.app.port}`);
    logger.info(`Swagger docs at http://localhost:${config.app.port}/docs`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown initiated');
    server.close(async () => {
      try {
        cronJobs?.stop();
        await notificationWorker?.close();
        await bulkWorker?.close();
        await queueManager.closeAll();
        const { disconnectDatabase } = await import('./config/database');
        const { disconnectRedis } = await import('./config/redis');
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection');
  });
};

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Bootstrap failed');
  process.exit(1);
});
