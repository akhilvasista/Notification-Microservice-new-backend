// import Joi from 'joi';

// export const createConfigSchema = Joi.object({
//   event: Joi.string().required(),
//   name: Joi.string().required(),
//   description: Joi.string().optional(),
//   conditions: Joi.object().default({}),
//   channels: Joi.array().items(Joi.string().valid('email', 'push', 'sms')).min(1).required(),
//   templateIds: Joi.object({
//     email: Joi.string().optional(),
//     push: Joi.string().optional(),
//     sms: Joi.string().optional(),
//   }).required(),
//   schedule: Joi.object({
//     type: Joi.string().valid('instant', 'delayed', 'recurring', 'cron').required(),
//     delay: Joi.string().optional(),
//     time: Joi.string().optional(),
//     cronExpression: Joi.string().optional(),
//   }).required(),
//   repeat: Joi.object({
//     count: Joi.number().min(1).required(),
//     frequency: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').required(),
//   }).optional(),
//   stopConditions: Joi.object().optional(),
//   fallback: Joi.object({
//     sms: Joi.boolean().optional(),
//     email: Joi.boolean().optional(),
//     push: Joi.boolean().optional(),
//   }).optional(),
//   priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
//   isActive: Joi.boolean().default(true),
//   metadata: Joi.object().optional(),
// });

// export const updateConfigSchema = createConfigSchema.fork(
//   ['event', 'name', 'channels', 'templateIds', 'schedule'],
//   (schema) => schema.optional()
// );






import Joi from 'joi';

export const createConfigSchema = Joi.object({
  event: Joi.string().required(),

  name: Joi.string().required(),

  description: Joi.string().optional(),

  conditions: Joi.object().default({}),

  channels: Joi.array()
    .items(Joi.string().valid('email', 'push', 'sms'))
    .min(1)
    .required(),

  templateIds: Joi.object({
    email: Joi.string().optional(),

    push: Joi.string().optional(),

    sms: Joi.string().optional(),
  }).required(),

  schedule: Joi.object({
    type: Joi.string()
      .valid('instant', 'scheduled')
      .required(),

    startDate: Joi.date().optional(),

    endDate: Joi.date().optional(),

    timezone: Joi.string().optional(),

    cronExpression: Joi.string().optional(),

    occurrence: Joi.object({
      frequency: Joi.string()
        .valid('daily', 'weekly', 'monthly', 'yearly')
        .required(),

      interval: Joi.number()
        .min(1)
        .default(1),

      times: Joi.array()
        .items(Joi.string())
        .optional(),

      daysOfWeek: Joi.array()
        .items(Joi.number().min(0).max(6))
        .optional(),

      daysOfMonth: Joi.array()
        .items(Joi.number().min(1).max(31))
        .optional(),
    }).optional(),
  }).required(),

  stopConditions: Joi.object().optional(),

  fallback: Joi.object({
    sms: Joi.boolean().optional(),

    email: Joi.boolean().optional(),

    push: Joi.boolean().optional(),
  }).optional(),

  priority: Joi.string()
    .valid('low', 'normal', 'high', 'critical')
    .default('normal'),

  isActive: Joi.boolean().default(true),

  metadata: Joi.object().optional(),
});

export const updateConfigSchema = createConfigSchema.fork(
  [
    'event',
    'name',
    'channels',
    'templateIds',
    'schedule',
  ],
  (schema) => schema.optional()
);