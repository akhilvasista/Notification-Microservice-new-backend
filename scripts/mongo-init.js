// MongoDB initialization script
db = db.getSiblingDB('notification_service');

// Create indexes for performance
db.notification_configs.createIndex({ event: 1, isActive: 1 });
db.notification_logs.createIndex({ userId: 1, event: 1, createdAt: -1 });
db.notification_logs.createIndex({ idempotencyKey: 1 }, { unique: true });
db.device_tokens.createIndex({ userId: 1, isActive: 1 });
db.device_tokens.createIndex({ token: 1 }, { unique: true });
db.idempotency_keys.createIndex({ key: 1 }, { unique: true });
db.idempotency_keys.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
db.notification_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
db.notification_metrics.createIndex({ date: 1, event: 1, channel: 1 }, { unique: true });

print('MongoDB indexes created successfully');
