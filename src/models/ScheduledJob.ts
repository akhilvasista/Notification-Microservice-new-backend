import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledJob extends Document {
  jobId: string;
  userId: string;
  event: string;
  queueName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: Date;
  completedAt?: Date;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledJobSchema = new Schema<IScheduledJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    event: { type: String, required: true },
    queueName: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    payload: { type: Schema.Types.Mixed, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ScheduledJob: Model<IScheduledJob> = mongoose.model(
  'ScheduledJob',
  ScheduledJobSchema,
  'scheduled_jobs'
);
