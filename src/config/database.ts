import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

/**
 * Connect to MongoDB. Optional overrides make isolated integration-test
 * databases possible without mutating process-wide configuration.
 */
export const connectDatabase = async (
  uri: string = config.db.uri,
  dbName: string = config.db.name
): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info({ dbName }, 'MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Reconnecting...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });
  } catch (error) {
    logger.error({ error, dbName }, 'Failed to connect to MongoDB');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
