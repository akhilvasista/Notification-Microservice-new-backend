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
import { validate } from '../middleware/validate';
import { apiRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';

import { emitEventSchema, bulkNotificationSchema } from '../validators/event.validator';
import { createConfigSchema, updateConfigSchema } from '../validators/notificationConfig.validator';
import { createTemplateSchema, updateTemplateSchema } from '../validators/template.validator';


// Wire dependencies
const scheduler = new Scheduler();
const ruleEngine = new RuleEngine(scheduler);
const eventProcessor = new EventProcessor(ruleEngine);

// Controllers
const eventCtrl = new EventController(eventProcessor);
const configCtrl = new ConfigController();
const templateCtrl = new TemplateController();
const logCtrl = new LogController();
const bulkCtrl = new BulkController();
const authCtrl = new AuthController();
const deviceCtrl = new DeviceController();

const router = Router();

// ============================================
// AUTH ROUTES
// ============================================
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', strictRateLimiter, authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);

// ============================================
// EVENT ROUTES (Internal / Microservice use)
// ============================================
/**
 * @swagger
 * /api/events/emit:
 *   post:
 *     summary: Emit a notification event (async)
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventPayload'
 *     responses:
 *       202:
 *         description: Event accepted
 */
router.post('/events/emit', apiRateLimiter, validate(emitEventSchema), eventCtrl.emit);
router.post('/events/emit/sync', apiRateLimiter, validate(emitEventSchema), eventCtrl.emitSync);

// ============================================
// DEVICE TOKEN ROUTES (Mobile apps)
// ============================================
router.post('/devices/register', apiRateLimiter, deviceCtrl.register);
router.delete('/devices/:token', deviceCtrl.deregister);
router.get('/devices/user/:userId', authenticate, deviceCtrl.getUserDevices);



router.post('/test/schedule-email', async (_req, res) => {
  try {
    const jobIds = await scheduler.scheduleCampaign(
      {
        userId: 'USER_1',

        event: 'SCHEDULED_EMAIL_TEST',

        channels: ['email'],

        templateIds: {
          email: 'scheduled_email_test',
        },

        priority: 'normal',

        context: {
          email: 'akhil1999vasista@gmail.com',
          parentName: 'Akhil',
        },
      },

      {
        type: 'scheduled',

        timezone: 'Asia/Kolkata',

        occurrence: {
          frequency: 'daily',

          interval: 1,

          times: ['11:06'],
        },
      }
    );

    res.json({
      success: true,
      jobIds,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error,
    });
  }
});




// ============================================
// ADMIN ROUTES (JWT Protected)
// ============================================

// Notification Configs
/**
 * @swagger
 * /api/admin/configs:
 *   get:
 *     summary: List notification configs
 *     tags: [Admin - Configs]
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/configs', authenticate, configCtrl.list);
// router.post('/admin/configs', authenticate, authorize('super_admin', 'admin'), validate(createConfigSchema), configCtrl.create);
router.post(
  '/admin/configs',
  validate(createConfigSchema),
  configCtrl.create
);
router.get('/admin/configs/:id', authenticate, configCtrl.getById);
router.put('/admin/configs/:id', authenticate, authorize('super_admin', 'admin'), validate(updateConfigSchema), configCtrl.update);
router.delete('/admin/configs/:id', authenticate, authorize('super_admin'), configCtrl.delete);
router.patch('/admin/configs/:id/toggle', authenticate, authorize('super_admin', 'admin'), configCtrl.toggle);

// Templates
/**
 * @swagger
 * /api/admin/templates:
 *   get:
 *     summary: List notification templates
 *     tags: [Admin - Templates]
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/templates', authenticate, templateCtrl.list);
// router.post('/admin/templates', authenticate, authorize('super_admin', 'admin'), validate(createTemplateSchema), templateCtrl.create);
router.post(
  '/admin/templates',
  validate(createTemplateSchema),
  templateCtrl.create
);
router.get('/admin/templates/:templateId', authenticate, templateCtrl.getById);
router.put('/admin/templates/:templateId', authenticate, authorize('super_admin', 'admin'), validate(updateTemplateSchema), templateCtrl.update);
router.delete('/admin/templates/:templateId', authenticate, authorize('super_admin'), templateCtrl.delete);
router.post('/admin/templates/:templateId/preview', authenticate, templateCtrl.preview);

// Logs & Metrics
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get notification logs
 *     tags: [Admin - Logs]
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/logs', authenticate, logCtrl.getLogs);
router.get('/admin/metrics', authenticate, logCtrl.getMetrics);
router.get('/admin/metrics/queue', authenticate, logCtrl.getQueueMetrics);
router.post('/admin/logs/:logId/retry', authenticate, authorize('super_admin', 'admin'), logCtrl.retryFailed);

// Bulk Notifications
/**
 * @swagger
 * /api/admin/bulk:
 *   post:
 *     summary: Trigger bulk notification campaign
 *     tags: [Admin - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkNotificationRequest'
 */
// router.post('/admin/bulk', authenticate, authorize('super_admin', 'admin'), validate(bulkNotificationSchema), bulkCtrl.trigger);

router.post(
  '/admin/bulk',
  validate(bulkNotificationSchema),
  bulkCtrl.trigger
);

export { router, eventProcessor };



//'CHILD_NOT_ADDED_REMINDER',

router.post(
  '/test/child-not-added',

  async (_req, res) => {
    try {
      const jobIds =
        await scheduler.scheduleCampaign(
          {
            userId: 'USER_002',

            event:
              'CHILD_NOT_ADDED_REMINDER',

            channels: ['email'],

            templateIds: {
              email:
                'child_not_added_reminder_email',
            },

            priority: 'normal',

            context: {
              email:
                'akhil1999vasista@gmail.com',

              parentName: 'Akhil',

              appLink:
                'https://app.qavach.com',
            },
          },

          {
            type: 'scheduled',

            timezone: 'Asia/Kolkata',

            occurrence: {
              frequency: 'daily',

              interval: 1,

              times: ['12:56'],
            },
          }
        );

      res.json({
        success: true,
        jobIds,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error,
      });
    }
  }
);



//social media 

router.post(
  '/test/social-post',

  async (_req, res) => {
    try {
      await scheduler.scheduleBulk([
        {
          userId: 'USER_1',

          event: 'SOCIAL_MEDIA_POSTED',

          channels: ['email'],

          templateIds: {
            email: 'social_media_post_email',
          },

          priority: 'normal',

          context: {
            email:
              'akhil1999vasista@gmail.com',

            parentName: 'Akhil',

            contentTitle:
              '5 Preventive Health Tips',

            platform: 'YouTube',

            contentLink:
              'https://youtube.com/example',
          },
        },
      ]);

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error,
      });
    }
  }
);


//child-added-success

router.post(
  '/test/child-added-success',

  async (_req, res) => {
    try {
      await scheduler.scheduleInstant({
        userId: 'USER_005',

        event: 'CHILD_ADDED_SUCCESS',

        channels: ['email'],

        templateIds: {
          email:
            'child_added_success_email',
        },

        priority: 'high',

        context: {
          email:
            'akhil1999vasista@gmail.com',

          parentName: 'Akhil',

          childName: 'Arjun',

          screeningVenue:
            'Bangalore Health Center',

          screeningDate:
            '25 May 2026',

          paymentAmount: '499',

          transactionId:
            'TXN123456',
        },
      });

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error,
      });
    }
  }
);



//gamification

router.post('/test/gamification', async (_req, res) => {
  try {
    await scheduler.scheduleCampaign(
      {
        userId: 'USER_001',
        event: 'GAMIFICATION_DAILY',
        channels: ['email'],
        templateIds: {
          email: 'gamification_daily_email',
        },
        priority: 'normal',
        context: {
          email: 'akhil1999vasista@gmail.com',
          parentName: 'Akhil',
          pointsEarned: 120,
          badgesWon: 'Health Starter',
          progressPercentage: 35,
          daysRemaining: 13,
        },
      },
      {
        type: 'scheduled',
        timezone: 'Asia/Kolkata',
        occurrence: {
          frequency: 'daily',
          interval: 1,
          times: ['12:02'],
        },
      }
    );

    res.json({
      success: true,
      message: 'Gamification campaign scheduled',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error,
    });
  }
});



//screening-reminder-3-days
router.post(
  '/test/screening-reminder-3-days',
  async (_req, res) => {
    try {
      await scheduler.scheduleCampaign(
        {
          userId: 'USER_001',

          event: 'SCREENING_REMINDER_3_DAYS',

          channels: ['email'],

          templateIds: {
            email: 'screening_reminder_3_days',
          },

          priority: 'high',

          context: {
            email: 'akhil1999vasista@gmail.com',

            parentName: 'Akhil',

            childName: 'Arjun',

            screeningVenue: 'Bangalore Health Center',

            screeningDate: '25 June 2026',
          },
        },

        {
          type: 'scheduled',

          timezone: 'Asia/Kolkata',

          occurrence: {
            frequency: 'daily',

            interval: 1,

            times: [
              '12:49', // CHANGE THIS
            ],
          },
        }
      );

      res.json({
        success: true,
        message: 'Screening reminder scheduled',
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error,
      });
    }
  }
);