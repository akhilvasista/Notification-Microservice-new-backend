# 🔔 Qavach Notification Microservice

Production-grade, event-driven notification microservice supporting **Email** (Amazon SES), **Push** (Firebase FCM), and **SMS** (MSG91 with DLT compliance).

---

## 🏗 Architecture

```
[API / Cron / External Service]
         │
         ▼
  ┌─────────────┐
  │ Event Layer │  POST /api/events/emit
  └──────┬──────┘
         │
         ▼
  ┌──────────────────┐
  │  Event Processor │  Validates payload
  └──────┬───────────┘
         │
         ▼
  ┌─────────────┐
  │ Rule Engine │  Fetches configs from DB → evaluates conditions
  └──────┬──────┘
         │
         ▼
  ┌───────────┐
  │ Scheduler │  BullMQ: instant / delayed / repeating / cron
  └──────┬────┘
         │
         ▼
  ┌────────┐
  │ Worker │  Executes job at scheduled time
  └──┬─────┘
     │  ① Check stop conditions
     │  ② Build context
     │  ③ Render Handlebars template
     │  ④ Dispatch to channel
     │  ⑤ Log result
     │  ⑥ Idempotency check
     │  ⑦ Retry on failure (exp. backoff)
     ▼
  ┌──────────────────────────┐
  │  SES │ FCM │ MSG91       │
  └──────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- MongoDB (via Docker)
- Redis (via Docker)

### 1 – Clone & configure

```bash
git clone <repo-url>
cd notification-service
cp .env.example .env
# Edit .env with your AWS, Firebase, MSG91 credentials
```

### 2 – Start infrastructure

```bash
# Production
docker-compose up -d

# Development (includes Mongo Express + Bull Board UIs)
docker-compose --profile dev up -d
```

### 3 – Install & seed (development)

```bash
npm install
npm run seed        # creates admin user + sample configs + templates
npm run dev         # starts with hot-reload
```

### 4 – Run with Docker (full stack)

```bash
docker-compose up --build
```

## 📡 API Reference

Full Swagger docs at `/docs`. Key endpoints:

### Events
```
POST /api/events/emit          # Async – fire and forget
POST /api/events/emit/sync     # Sync – wait for processing
```

### Admin (JWT required)
```
POST   /api/auth/login
GET    /api/admin/configs
POST   /api/admin/configs
PATCH  /api/admin/configs/:id/toggle
GET    /api/admin/templates
POST   /api/admin/templates
POST   /api/admin/templates/:id/preview
POST   /api/admin/bulk
GET    /api/admin/logs
GET    /api/admin/metrics
GET    /api/admin/metrics/queue
POST   /api/admin/logs/:logId/retry
```

### Devices
```
POST   /api/devices/register
DELETE /api/devices/:token
GET    /api/devices/user/:userId
```

---

## 🔔 Notification Scenarios

### 1. User Signup → Add Child Reminder (15 days)

```json
POST /api/events/emit
{
  "event": "USER_SIGNED_UP",
  "userId": "user_123",
  "timestamp": "2026-05-18T10:00:00Z"
}
```

→ Sends welcome immediately, then daily reminders for 15 days (stops when child added).

### 2. Appointment Booked → Auto Reminders

```json
POST /api/events/emit
{
  "event": "APPOINTMENT_BOOKED",
  "userId": "user_123",
  "appointmentDate": "2026-06-15T10:00:00Z",
  "centerId": "CENTER_BLR"
}
```

→ Auto-schedules reminders at T-3 days, T-1 day, T-3 hours.

### 3. Bulk Campaign

```json
POST /api/admin/bulk
Authorization: Bearer <token>
{
  "templateId": "tmpl_add_child_reminder_email",
  "channels": ["email", "push"],
  "filters": { "inactiveDays": 15, "hasChild": false }
}
```

---

## 🗄 Database Collections

| Collection | Purpose |
|---|---|
| `notification_configs` | Business rules (event → channels, schedule, conditions) |
| `notification_templates` | Handlebars templates for each channel |
| `notification_logs` | Delivery audit trail (90-day TTL) |
| `device_tokens` | FCM tokens per user |
| `idempotency_keys` | Deduplication (30-day TTL) |
| `scheduled_jobs` | Job tracking |
| `admin_users` | Admin accounts |
| `notification_metrics` | Aggregated daily metrics |

---

## ⚙️ Queue System

| Queue | Purpose |
|---|---|
| `notification` | Standard notifications (concurrency: 5) |
| `bulk-notification` | Bulk campaigns (concurrency: 2, rate-limited) |
| `dead-letter` | Failed jobs needing manual review |

Retry: **3 attempts** with **exponential backoff** (5s, 10s, 20s).

---

## 🧪 Tests

```bash
npm test              # all tests
npm run test:unit     # unit tests only
npm run test:integration  # requires running MongoDB
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with dev UIs
docker-compose --profile dev up -d

# View logs
docker-compose logs -f notification-service

# Rebuild service
docker-compose up --build notification-service

# Seed inside Docker
docker-compose exec notification-service node -e "
  require('./dist/scripts/seed');
"

# Stop all
docker-compose down

# Remove volumes (reset data)
docker-compose down -v
```

---

## 📁 Folder Structure

```
notification-service/
├── src/
│   ├── config/          # App, DB, Redis, Swagger config
│   ├── controllers/     # HTTP route handlers
│   ├── dispatchers/     # Channel dispatch orchestration
│   ├── events/          # Event types & processor
│   ├── integrations/    # SES, FCM, MSG91, MS Graph clients
│   ├── middleware/       # Auth, validation, error handler
│   ├── models/          # Mongoose schemas
│   ├── monitoring/      # Health check, cron jobs
│   ├── queue/           # BullMQ queue manager
│   ├── routes/          # Express router
│   ├── rule-engine/     # Config evaluation logic
│   ├── scheduler/       # Job scheduling abstraction
│   ├── services/        # Idempotency, logging, user context
│   ├── templates/       # Handlebars template engine
│   ├── utils/           # Logger, errors, helpers
│   ├── validators/      # Joi schemas
│   ├── workers/         # BullMQ workers
│   ├── app.ts           # Express app factory
│   └── server.ts        # Bootstrap entry point
├── tests/
│   ├── unit/            # Unit tests (jest + mocks)
│   └── integration/     # Integration tests (supertest)
├── scripts/
│   ├── seed.ts          # DB seed script
│   └── mongo-init.js    # MongoDB init indexes
├── docs/
│   └── postman_collection.json
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔐 Security

- JWT authentication on all admin routes
- Role-based access control (`super_admin`, `admin`, `viewer`)
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/15min default, 20 req/15min for auth)
- Input validation via Joi on all endpoints
- Passwords hashed with SHA-256
- ENV-based secrets (never hardcoded)
- DLT compliance for SMS (MSG91)

---

## 📊 Monitoring

- `/health` – liveness probe (MongoDB + Redis + Queue status)
- `/ready` – readiness probe
- `/api/admin/metrics` – notification delivery metrics
- `/api/admin/metrics/queue` – BullMQ queue stats
- Bull Board UI at `:3001` (dev profile)
- Structured JSON logging via Pino
