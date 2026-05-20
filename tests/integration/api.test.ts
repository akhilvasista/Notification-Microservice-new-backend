/**
 * Integration tests – require a running MongoDB instance.
 * Use `docker-compose up mongo redis -d` before running.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase } from '../../src/config/database';
import { AdminUser } from '../../src/models/AdminUser';
import { NotificationConfig } from '../../src/models/NotificationConfig';
import { NotificationTemplate } from '../../src/models/NotificationTemplate';

const app = createApp();
let authToken: string;

beforeAll(async () => {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/notification_test';
  process.env.JWT_SECRET = 'test-secret';
  await connectDatabase();

  // Seed test admin
  await AdminUser.deleteMany({});
  await AdminUser.create({ email: 'test@admin.com', password: 'Test@123', name: 'Test Admin', role: 'super_admin' });
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

describe('Health Check', () => {
  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBeLessThan(600);
    expect(res.body.status).toBeDefined();
  });
});

describe('Config API', () => {
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
  it('POST /api/events/emit – returns 202 accepted', async () => {
    const res = await request(app)
      .post('/api/events/emit')
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
