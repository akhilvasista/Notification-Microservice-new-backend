import { NotificationTemplate } from '../models/NotificationTemplate';

import { NotificationConfig } from '../models/NotificationConfig';

import { parentTemplates } from './templates/parentTemplates';

import { parentConfigs } from './templates/configs/parentConfigs';

import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

async function seedTemplates() {
  for (const template of parentTemplates) {
    await NotificationTemplate.findOneAndUpdate(
      {
        templateId: template.templateId,
      },

      template,

      {
        upsert: true,
        new: true,
      }
    );

    logger.info({ templateId: template.templateId }, 'Notification template seeded');
  }
}

async function seedConfigs() {
  for (const config of parentConfigs) {
    await NotificationConfig.findOneAndUpdate(
      {
        event: config.event,
        name: config.name,
      },

      config,

      {
        upsert: true,
        new: true,
      }
    );

    logger.info({ configName: config.name }, 'Notification config seeded');
  }
}

async function runSeeder() {
  try {
    await connectDatabase();

    logger.info('Starting notification seeder');

    await seedTemplates();

    await seedConfigs();

    logger.info('Notification seeder completed');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Notification seeder failed');

    process.exit(1);
  }
}

runSeeder();