import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'retrying' | 'skipped';

export interface INotificationLog extends Document {
  userId: string;
  event: string;
  channel: 'email' | 'push' | 'sms' |'inapp';
  templateId?: string;
  status: NotificationStatus;
  attempt: number;
  errorMessage?: string;
  errorCode?: string;
  providerResponse?: Record<string, unknown>;
  idempotencyKey: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    userId: { type: String, required: true, index: true },
    event: { type: String, required: true, index: true },
    channel: { type: String, enum: ['email', 'push', 'sms','inapp'], required: true },
    templateId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'retrying', 'skipped'],
      default: 'pending',
      index: true,
    },
    attempt: { type: Number, default: 1 },
    errorMessage: { type: String },
    errorCode: { type: String },
    providerResponse: { type: Schema.Types.Mixed },
    idempotencyKey: { type: String, required: true, index: true },
    jobId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ userId: 1, event: 1, channel: 1, createdAt: -1 });
NotificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90d TTL

export const NotificationLog: Model<INotificationLog> = mongoose.model(
  'NotificationLog',
  NotificationLogSchema,
  'notification_logs'
);
