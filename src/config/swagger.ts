import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qavach Notification Service API',
      version: '1.0.0',
      description: 'Production-grade event-driven notification microservice supporting Email (SES), Push (FCM), and SMS (MSG91)',
      contact: { name: 'Qavach Engineering', email: 'engineering@qavach.com' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://notifications.qavach.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        EventPayload: {
          type: 'object',
          required: ['event', 'userId', 'timestamp'],
          properties: {
            event: { type: 'string', example: 'USER_SIGNED_UP' },
            userId: { type: 'string', example: 'user_123' },
            timestamp: { type: 'string', format: 'date-time' },
            eventId: { type: 'string', description: 'For idempotency' },
            metadata: { type: 'object' },
          },
        },
        NotificationConfig: {
          type: 'object',
          required: ['event', 'name', 'channels', 'templateIds', 'schedule'],
          properties: {
            event: { type: 'string' },
            name: { type: 'string' },
            conditions: { type: 'object' },
            channels: { type: 'array', items: { type: 'string', enum: ['email', 'push', 'sms'] } },
            templateIds: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                push: { type: 'string' },
                sms: { type: 'string' },
              },
            },
            schedule: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['instant', 'delayed', 'recurring', 'cron'] },
                delay: { type: 'string', example: '1d' },
                time: { type: 'string', example: '09:00' },
                cronExpression: { type: 'string' },
              },
            },
            repeat: {
              type: 'object',
              properties: {
                count: { type: 'number' },
                frequency: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly'] },
              },
            },
            stopConditions: { type: 'object' },
            fallback: { type: 'object' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
            isActive: { type: 'boolean' },
          },
        },
        NotificationTemplate: {
          type: 'object',
          required: ['templateId', 'name', 'type', 'body'],
          properties: {
            templateId: { type: 'string', example: 'tmpl_signup_email' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['email', 'push', 'sms'] },
            subject: { type: 'string' },
            body: { type: 'string', description: 'Handlebars template' },
            title: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
        },
        BulkNotificationRequest: {
          type: 'object',
          required: ['templateId', 'channels'],
          properties: {
            templateId: { type: 'string' },
            channels: { type: 'array', items: { type: 'string', enum: ['email', 'push', 'sms'] } },
            filters: {
              type: 'object',
              properties: {
                inactiveDays: { type: 'number' },
                hasChild: { type: 'boolean' },
                userIds: { type: 'array', items: { type: 'string' } },
                role: { type: 'string' },
              },
            },
            scheduledAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
