import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';
import { queueManager, QUEUE_NAMES } from '../queue/QueueManager';

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  const checks: Record<string, string> = {};

  // MongoDB
  try {
    const state = mongoose.connection.readyState;
    checks.mongodb = state === 1 ? 'healthy' : 'unhealthy';
  } catch {
    checks.mongodb = 'unhealthy';
  }

  // Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = 'healthy';
  } catch {
    checks.redis = 'unhealthy';
  }

  // Queue
  try {
    const metrics = await queueManager.getQueueMetrics(QUEUE_NAMES.NOTIFICATION);
    checks.queue = 'healthy';
    checks.queueWaiting = String(metrics.waiting);
    checks.queueActive = String(metrics.active);
    checks.queueFailed = String(metrics.failed);
  } catch {
    checks.queue = 'unhealthy';
  }

  const isHealthy = Object.values(checks).every((v) => v !== 'unhealthy');
  const status = isHealthy ? 200 : 503;

  res.status(status).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
};
