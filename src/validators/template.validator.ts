import Joi from 'joi';

export const createTemplateSchema = Joi.object({
  templateId: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().valid('email', 'push', 'sms').required(),
  subject: Joi.string().when('type', { is: 'email', then: Joi.required() }),
  body: Joi.string().required(),
  title: Joi.string().when('type', { is: 'push', then: Joi.required() }),
  variables: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.fork(
  ['templateId', 'name', 'type', 'body'],
  (schema) => schema.optional()
);
