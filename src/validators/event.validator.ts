import Joi from 'joi';

export const emitEventSchema = Joi.object({
  event: Joi.string().required(),
  userId: Joi.string().required(),
  timestamp: Joi.string().isoDate().default(() => new Date().toISOString()),
  eventId: Joi.string().optional(),
  metadata: Joi.object().optional(),
}).unknown(true); // Allow extra fields like appointmentDate, childId etc.

export const bulkNotificationSchema = Joi.object({
  templateId: Joi.string().required(),
  channels: Joi.array().items(Joi.string().valid('email', 'push', 'sms')).min(1).required(),
  filters: Joi.object({
    inactiveDays: Joi.number().optional(),
    hasChild: Joi.boolean().optional(),
    userIds: Joi.array().items(Joi.string()).optional(),
    role: Joi.string().optional(),
  }).optional().default({}),
  scheduledAt: Joi.string().isoDate().optional(),
});
