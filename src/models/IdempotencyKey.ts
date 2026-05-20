import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  userId: string;
  event: string;
  channel: string;
  status: 'processed' | 'processing';
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    event: { type: String, required: true },
    channel: { type: String, required: true },
    status: { type: String, enum: ['processed', 'processing'], default: 'processing' },
  },
  { timestamps: true }
);

// Auto-expire after 30 days
IdempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const IdempotencyKey: Model<IIdempotencyKey> = mongoose.model(
  'IdempotencyKey',
  IdempotencyKeySchema,
  'idempotency_keys'
);
