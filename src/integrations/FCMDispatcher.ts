import admin from 'firebase-admin';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

let initialized = false;

function initializeFirebase(): void {
  if (!initialized && config.firebase.projectId) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKeyId: config.firebase.privateKeyId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
        clientId: config.firebase.clientId,
      } as admin.ServiceAccount),
    });
    initialized = true;
  }
}

export class FCMDispatcher {
  constructor() {
    initializeFirebase();
  }

  async send(payload: PushPayload): Promise<{ messageId: string }> {
    const message: admin.messaging.Message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
      },
      data: payload.data || {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    try {
      const messageId = await admin.messaging().send(message);
      logger.info({ messageId, token: payload.token.slice(0, 10) + '...' }, 'Push sent via FCM');
      return { messageId };
    } catch (error) {
      logger.error({ error }, 'FCM push send failed');
      throw error;
    }
  }

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<{ successCount: number; failureCount: number }> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: data || {},
      android: { priority: 'high' },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info({ successCount: response.successCount, failureCount: response.failureCount }, 'FCM multicast sent');
    return { successCount: response.successCount, failureCount: response.failureCount };
  }
}
