import { Router } from 'express';
import { EventProcessor } from '../events/EventProcessor';
import { RuleEngine } from '../rule-engine/RuleEngine';
import { Scheduler } from '../scheduler/Scheduler';

import { EventController } from '../controllers/EventController';
import { ConfigController } from '../controllers/ConfigController';
import { TemplateController } from '../controllers/TemplateController';
import { LogController } from '../controllers/LogController';
import { BulkController } from '../controllers/BulkController';
import { AuthController } from '../controllers/AuthController';
import { DeviceController } from '../controllers/DeviceController';

import { authenticate, authorize } from '../middleware/auth';
import { authenticateService } from '../middleware/serviceAuth';
import { validate } from '../middleware/validate';
import { apiRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';

import { emitEventSchema, bulkNotificationSchema } from '../validators/event.validator';
import { createConfigSchema, updateConfigSchema } from '../validators/notificationConfig.validator';
import { createTemplateSchema, updateTemplateSchema } from '../validators/template.validator';

// Wire dependencies.
const scheduler = new Scheduler();
const ruleEngine = new RuleEngine(scheduler);
const eventProcessor = new EventProcessor(ruleEngine);

// Controllers.
const eventCtrl = new EventController(eventProcessor);
const configCtrl = new ConfigController();
const templateCtrl = new TemplateController();
const logCtrl = new LogController();
const bulkCtrl = new BulkController();
const authCtrl = new AuthController();
const deviceCtrl = new DeviceController();

const router = Router();

// Authentication.
router.post('/auth/login', strictRateLimiter, authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);

// Event ingestion is restricted to trusted internal callers and validated before processing.
router.post('/events/emit', authenticateService, apiRateLimiter, validate(emitEventSchema), eventCtrl.emit);
router.post('/events/emit/sync', authenticateService, apiRateLimiter, validate(emitEventSchema), eventCtrl.emitSync);

// Device registration endpoints used by client applications.
router.post('/devices/register', authenticateService, apiRateLimiter, deviceCtrl.register);
router.delete('/devices/:token', authenticateService, apiRateLimiter, deviceCtrl.deregister);
router.get('/devices/user/:userId', authenticate, deviceCtrl.getUserDevices);

// Notification configuration management.
router.get('/admin/configs', authenticate, configCtrl.list);
router.post(
  '/admin/configs',
  authenticate,
  authorize('super_admin', 'admin'),
  validate(createConfigSchema),
  configCtrl.create
);
router.get('/admin/configs/:id', authenticate, configCtrl.getById);
router.put(
  '/admin/configs/:id',
  authenticate,
  authorize('super_admin', 'admin'),
  validate(updateConfigSchema),
  configCtrl.update
);
router.delete('/admin/configs/:id', authenticate, authorize('super_admin'), configCtrl.delete);
router.patch(
  '/admin/configs/:id/toggle',
  authenticate,
  authorize('super_admin', 'admin'),
  configCtrl.toggle
);

// Notification template management.
router.get('/admin/templates', authenticate, templateCtrl.list);
router.post(
  '/admin/templates',
  authenticate,
  authorize('super_admin', 'admin'),
  validate(createTemplateSchema),
  templateCtrl.create
);
router.get('/admin/templates/:templateId', authenticate, templateCtrl.getById);
router.put(
  '/admin/templates/:templateId',
  authenticate,
  authorize('super_admin', 'admin'),
  validate(updateTemplateSchema),
  templateCtrl.update
);
router.delete('/admin/templates/:templateId', authenticate, authorize('super_admin'), templateCtrl.delete);
router.post(
  '/admin/templates/:templateId/preview',
  authenticate,
  authorize('super_admin', 'admin', 'viewer'),
  templateCtrl.preview
);

// Logs and operational metrics.
router.get('/admin/logs', authenticate, logCtrl.getLogs);
router.get('/admin/metrics', authenticate, logCtrl.getMetrics);
router.get('/admin/metrics/queue', authenticate, logCtrl.getQueueMetrics);
router.post(
  '/admin/logs/:logId/retry',
  authenticate,
  authorize('super_admin', 'admin'),
  logCtrl.retryFailed
);

// Bulk campaigns can trigger high-volume external notifications.
router.post(
  '/admin/bulk',
  authenticate,
  authorize('super_admin', 'admin'),
  validate(bulkNotificationSchema),
  bulkCtrl.trigger
);

export { router, eventProcessor };
