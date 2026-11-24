/**
 * Integration tests – require a running MongoDB instance.
 * Use `docker-compose up mongo redis -d` before running.
 */
import request from 'supertest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase } from '../../src/config/database';
import { AdminUser } from '../../src/models/AdminUser';
import { NotificationConfig } from '../../src/models/NotificationConfig';
import { NotificationTemplate } from '../../src/models/NotificationTemplate';
import { config } from '../../src/config';

const app = createApp();
const testDatabaseName = `notification_test_${process.pid}`;
let authToken: string;

beforeAll(async () => {
  config.jwt.secret = 'integration-test-secret-at-least-32-characters';
  config.serviceApiKey = 'integration-test-service-key-at-least-32';
  config.queueDashboard.username = 'test-operator';
  config.queueDashboard.password = 'integration-dashboard-password';
  await connectDatabase(config.db.uri, testDatabaseName);

  // Seed test admin
  await AdminUser.deleteMany({});
  await AdminUser.create({ email: 'test@admin.com', password: 'Test@123', name: 'Test Admin', role: 'super_admin' });

  const legacyAdmin = await AdminUser.create({
    email: 'legacy@admin.com',
    password: 'Legacy@123',
    name: 'Legacy Admin',
    role: 'admin',
  });
  await AdminUser.collection.updateOne(
    { _id: legacyAdmin._id },
    { $set: { password: crypto.createHash('sha256').update('Legacy@123').digest('hex') } }
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth API', () => {
  it('POST /api/auth/login – success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@admin.com', password: 'Test@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  it('POST /api/auth/login – upgrades a legacy SHA-256 password after successful login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'legacy@admin.com', password: 'Legacy@123' });

    expect(res.status).toBe(200);

    const migratedAdmin = await AdminUser.findOne({ email: 'legacy@admin.com' }).select('+password');
    expect(migratedAdmin?.password).toMatch(/^scrypt\$/);
    expect(await migratedAdmin?.comparePassword('Legacy@123')).toBe(true);
  });

  it('POST /api/auth/login – invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@admin.com', password: 'WrongPass' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me – authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@admin.com');
  });
});

describe('Queue Dashboard Security', () => {
  it('GET /admin/queues – rejects unauthenticated access', async () => {
    const res = await request(app).get('/admin/queues');
    expect(res.status).toBe(401);
  });
});

describe('Health Check', () => {
  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBeLessThan(600);
    expect(res.body.status).toBeDefined();
  });
});

describe('Config API', () => {
  it('POST /api/admin/configs – rejects unauthenticated writes', async () => {
    const res = await request(app)
      .post('/api/admin/configs')
      .send({ event: 'UNAUTHORIZED_EVENT' });

    expect(res.status).toBe(401);
  });

  const configPayload = {
    event: 'TEST_EVENT',
    name: 'Test Config',
    channels: ['email'],
    templateIds: { email: 'tmpl_test' },
    schedule: { type: 'instant' },
    priority: 'normal',
    conditions: {},
  };

  it('POST /api/admin/configs – creates config', async () => {
    const res = await request(app)
      .post('/api/admin/configs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(configPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.event).toBe('TEST_EVENT');
  });

  it('GET /api/admin/configs – lists configs', async () => {
    const res = await request(app)
      .get('/api/admin/configs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.docs)).toBe(true);
  });

  it('POST /api/admin/configs – rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/admin/configs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ event: 'INCOMPLETE' });

    expect(res.status).toBe(400);
  });
});

describe('Template API', () => {
  it('POST /api/admin/templates – rejects unauthenticated writes', async () => {
    const res = await request(app)
      .post('/api/admin/templates')
      .send({ templateId: 'unauthorized', name: 'Unauthorized', type: 'email', body: 'No access' });

    expect(res.status).toBe(401);
  });

  const templatePayload = {
    templateId: 'tmpl_integration_test',
    name: 'Integration Test Template',
    type: 'email',
    subject: 'Test {{name}}',
    body: '<p>Hello {{name}}</p>',
    variables: ['name'],
  };

  it('POST /api/admin/templates – creates template', async () => {
    const res = await request(app)
      .post('/api/admin/templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send(templatePayload);

    expect(res.status).toBe(201);
    expect(res.body.data.templateId).toBe('tmpl_integration_test');
  });

  it('POST /api/admin/templates/:id/preview – renders template', async () => {
    const res = await request(app)
      .post('/api/admin/templates/tmpl_integration_test/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ context: { name: 'Sandeep' } });

    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe('<p>Hello Sandeep</p>');
  });
});

describe('Event API', () => {
  it('POST /api/events/emit – rejects missing service credentials', async () => {
    const res = await request(app)
      .post('/api/events/emit')
      .send({ event: 'USER_SIGNED_UP', userId: 'test_user_1' });

    expect(res.status).toBe(401);
  });

  it('POST /api/events/emit – returns 202 accepted', async () => {
    const res = await request(app)
      .post('/api/events/emit')
      .set('x-service-key', config.serviceApiKey)
      .send({
        event: 'USER_SIGNED_UP',
        userId: 'test_user_1',
        timestamp: new Date().toISOString(),
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/events/emit – rejects missing userId', async () => {
    const res = await request(app)
      .post('/api/events/emit')
      .set('x-service-key', config.serviceApiKey)
      .send({ event: 'USER_SIGNED_UP', timestamp: new Date().toISOString() });

    expect(res.status).toBe(400);
  });
});

describe('Device API', () => {
  it('POST /api/devices/register – registers device token', async () => {
    const res = await request(app)
      .post('/api/devices/register')
      .send({ userId: 'test_user_1', token: 'fcm_test_token_123', platform: 'android' });

    expect(res.status).toBe(201);
  });
});
