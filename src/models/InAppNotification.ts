import mongoose, { Schema, Document, Model } from 'mongoose';

// export interface IInAppNotification extends Document {
//   userId: string;

//   title: string;

//   body: string;

//   type: string;

//   isRead: boolean;

//   metadata?: Record<string, unknown>;

//   createdAt: Date;

//   updatedAt: Date;
// }



export interface IInAppNotification extends Document {
  userId: string;

  event: string;

  title: string;

  body: string;

  type: string;

  isRead: boolean;

  metadata?: Record<string, unknown>;

  createdAt: Date;

  updatedAt: Date;
}



const InAppNotificationSchema = new Schema<IInAppNotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    event: {
  type: String,
  required: true,
  index: true,
},

    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    
  },
  {
    timestamps: true,
  }
);

InAppNotificationSchema.index({
  userId: 1,
  createdAt: -1,
});

export const InAppNotification: Model<IInAppNotification> =
  mongoose.model(
    'InAppNotification',
    InAppNotificationSchema,
    'in_app_notifications'
  );