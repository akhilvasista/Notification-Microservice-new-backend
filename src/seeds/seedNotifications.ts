import mongoose from 'mongoose';

import { NotificationTemplate } from '../models/NotificationTemplate';

import { NotificationConfig } from '../models/NotificationConfig';

import { parentTemplates } from './templates/parentTemplates';

import { parentConfigs } from './templates/configs/parentConfigs';

import { connectDatabase } from '../config/database';

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

    console.log(
      `✅ Template Seeded: ${template.templateId}`
    );
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

    console.log(
      `✅ Config Seeded: ${config.name}`
    );
  }
}

async function runSeeder() {
  try {
    await connectDatabase();

    console.log(
      '🚀 Starting Notification Seeder...'
    );

    await seedTemplates();

    await seedConfigs();

    console.log(
      '🎉 Notification Seeder Completed'
    );

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

runSeeder();