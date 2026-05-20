import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationMetric extends Document {
  date: string; // YYYY-MM-DD
  event: string;
  channel: 'email' | 'push' | 'sms';
  sent: number;
  failed: number;
  skipped: number;
  retried: number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationMetricSchema = new Schema<INotificationMetric>(
  {
    date: { type: String, required: true, index: true },
    event: { type: String, required: true },
    channel: { type: String, enum: ['email', 'push', 'sms'], required: true },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    retried: { type: Number, default: 0 },
  },
  { timestamps: true }
);

NotificationMetricSchema.index({ date: 1, event: 1, channel: 1 }, { unique: true });

export const NotificationMetric: Model<INotificationMetric> = mongoose.model(
  'NotificationMetric',
  NotificationMetricSchema,
  'notification_metrics'
);
