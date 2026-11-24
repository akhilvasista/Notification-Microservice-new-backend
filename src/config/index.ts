import dotenv from 'dotenv';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const serviceApiKey = process.env.SERVICE_API_KEY;
const queueDashboardUsername = process.env.QUEUE_DASHBOARD_USERNAME;
const queueDashboardPassword = process.env.QUEUE_DASHBOARD_PASSWORD;
if (
  process.env.NODE_ENV === 'production' &&
  (!jwtSecret || jwtSecret.length < 32)
) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.');
}

if (process.env.NODE_ENV === 'production' && (!serviceApiKey || serviceApiKey.length < 32)) {
  throw new Error('SERVICE_API_KEY must be set to a random value of at least 32 characters in production.');
}

if (
  process.env.NODE_ENV === 'production' &&
  (!queueDashboardUsername || !queueDashboardPassword || queueDashboardPassword.length < 16)
) {
  throw new Error('QUEUE_DASHBOARD_USERNAME and a QUEUE_DASHBOARD_PASSWORD of at least 16 characters are required in production.');
}

export const config = {
  serviceApiKey: serviceApiKey || '',
  queueDashboard: {
    username: queueDashboardUsername || '',
    password: queueDashboardPassword || '',
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    serviceName: process.env.SERVICE_NAME || 'notification-service',
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification_service',
    name: process.env.MONGODB_DB_NAME || 'notification_service',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: jwtSecret || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    ses: {
      fromEmail: process.env.SES_FROM_EMAIL || 'noreply@example.com',
      fromName: process.env.SES_FROM_NAME || 'Notification Service',
    },
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    clientId: process.env.FIREBASE_CLIENT_ID || '',
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '',
    senderId: process.env.MSG91_SENDER_ID || 'NOTFSV',
    dltTeId: process.env.MSG91_DLT_TE_ID || '',
    route: process.env.MSG91_ROUTE || '4',
  },
  microsoftGraph: {
    tenantId: process.env.MS_GRAPH_TENANT_ID || '',
    clientId: process.env.MS_GRAPH_CLIENT_ID || '',
    clientSecret: process.env.MS_GRAPH_CLIENT_SECRET || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    bulkBatchSize: parseInt(process.env.BULK_NOTIFICATION_BATCH_SIZE || '100', 10),
    bulkDelayMs: parseInt(process.env.BULK_NOTIFICATION_DELAY_MS || '1000', 10),
  },
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || '3', 10),
    backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '5000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
};

export type AppConfig = typeof config;
