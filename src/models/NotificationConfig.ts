// import mongoose, { Schema, Document, Model } from 'mongoose';

// export interface IConditions {
//   [key: string]: boolean | string | number;
// }

// // export interface ISchedule {
// //   type: 'instant' | 'delayed' | 'recurring' | 'cron';
// //   delay?: string; // e.g. "1d", "3h"
// //   time?: string;  // e.g. "09:00"
// //   cronExpression?: string;
// // }


// export interface ISchedule {
//   type: 'instant' | 'scheduled';

//   startDate?: Date;

//   endDate?: Date;

//   timezone?: string;

//   cronExpression?: string;

//   occurrence?: {
//     frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

//     interval?: number;

//     times?: string[];

//     daysOfWeek?: number[];

//     daysOfMonth?: number[];
//   };
// }




// export interface IRepeat {
//   count: number;
//   frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
// }

// export interface IFallback {
//   sms?: boolean;
//   email?: boolean;
//   push?: boolean;
// }

// export interface INotificationConfig extends Document {
//   event: string;
//   name: string;
//   description?: string;
//   conditions: IConditions;
//   channels: ('email' | 'push' | 'sms')[];
//   templateIds: { email?: string; push?: string; sms?: string };
//   schedule: ISchedule;
//   repeat?: IRepeat;
//   stopConditions?: IConditions;
//   fallback?: IFallback;
//   priority: 'low' | 'normal' | 'high' | 'critical';
//   isActive: boolean;
//   metadata?: Record<string, unknown>;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const NotificationConfigSchema = new Schema<INotificationConfig>(
//   {
//     event: { type: String, required: true, index: true },
//     name: { type: String, required: true },
//     description: { type: String },
//     conditions: { type: Schema.Types.Mixed, default: {} },
//     channels: {
//       type: [String],
//       enum: ['email', 'push', 'sms'],
//       required: true,
//     },
//     templateIds: {
//       email: { type: String },
//       push: { type: String },
//       sms: { type: String },
//     },
//     schedule: {
//       type: {
//         type: String,
//         enum: ['instant', 'delayed', 'recurring', 'cron'],
//         required: true,
//       },
//       delay: { type: String },
//       time: { type: String },
//       cronExpression: { type: String },
//     },
//     repeat: {
//       count: { type: Number },
//       frequency: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'] },
//     },
//     stopConditions: { type: Schema.Types.Mixed },
//     fallback: {
//       sms: { type: Boolean },
//       email: { type: Boolean },
//       push: { type: Boolean },
//     },
//     priority: {
//       type: String,
//       enum: ['low', 'normal', 'high', 'critical'],
//       default: 'normal',
//     },
//     isActive: { type: Boolean, default: true, index: true },
//     metadata: { type: Schema.Types.Mixed },
//   },
//   { timestamps: true }
// );

// NotificationConfigSchema.index({ event: 1, isActive: 1 });

// export const NotificationConfig: Model<INotificationConfig> = mongoose.model(
//   'NotificationConfig',
//   NotificationConfigSchema,
//   'notification_configs'
// );







import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConditions {
  [key: string]: boolean | string | number;
}

export interface ISchedule {
  type: 'instant' | 'scheduled';

  startDate?: Date;

  endDate?: Date;

  timezone?: string;

  cronExpression?: string;

  occurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

    interval?: number;

    times?: string[];

    daysOfWeek?: number[];

    daysOfMonth?: number[];
  };
}

export interface IFallback {
  sms?: boolean;
  email?: boolean;
  push?: boolean;
}

export interface INotificationConfig extends Document {
  event: string;

  name: string;

  description?: string;

  conditions: IConditions;

  channels: ('email' | 'push' | 'sms')[];

  templateIds: {
    email?: string;
    push?: string;
    sms?: string;
  };

  schedule: ISchedule;

  stopConditions?: IConditions;

  fallback?: IFallback;

  priority: 'low' | 'normal' | 'high' | 'critical';

  isActive: boolean;

  metadata?: Record<string, unknown>;

  createdAt: Date;

  updatedAt: Date;
}

const NotificationConfigSchema = new Schema<INotificationConfig>(
  {
    event: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    conditions: {
      type: Schema.Types.Mixed,
      default: {},
    },

    channels: {
      type: [String],
      enum: ['email', 'push', 'sms'],
      required: true,
    },

    templateIds: {
      email: { type: String },
      push: { type: String },
      sms: { type: String },
    },

    schedule: {
      type: {
        type: String,
        enum: ['instant', 'scheduled'],
        required: true,
      },

      startDate: {
        type: Date,
      },

      endDate: {
        type: Date,
      },

      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },

      cronExpression: {
        type: String,
      },

      occurrence: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
        },

        interval: {
          type: Number,
          default: 1,
        },

        times: [
          {
            type: String,
          },
        ],

        daysOfWeek: [
          {
            type: Number,
          },
        ],

        daysOfMonth: [
          {
            type: Number,
          },
        ],
      },
    },

    stopConditions: {
      type: Schema.Types.Mixed,
    },

    fallback: {
      sms: { type: Boolean },
      email: { type: Boolean },
      push: { type: Boolean },
    },

    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

NotificationConfigSchema.index({
  event: 1,
  isActive: 1,
});

export const NotificationConfig: Model<INotificationConfig> =
  mongoose.model(
    'NotificationConfig',
    NotificationConfigSchema,
    'notification_configs'
  );