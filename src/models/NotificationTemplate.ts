import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationTemplate extends Document {
  templateId: string;
  name: string;
  type: 'email' | 'push' | 'sms';
  subject?: string;   // For email
  body: string;       // Handlebars template string
  title?: string;     // For push notifications
  variables: string[]; // List of expected template variables
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['email', 'push', 'sms'], required: true },
    subject: { type: String },
    body: { type: String, required: true },
    title: { type: String },
    variables: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const NotificationTemplate: Model<INotificationTemplate> = mongoose.model(
  'NotificationTemplate',
  NotificationTemplateSchema,
  'notification_templates'
);
