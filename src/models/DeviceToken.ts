import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeviceToken extends Document {
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], required: true },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

DeviceTokenSchema.index({ userId: 1, isActive: 1 });

export const DeviceToken: Model<IDeviceToken> = mongoose.model(
  'DeviceToken',
  DeviceTokenSchema,
  'device_tokens'
);
