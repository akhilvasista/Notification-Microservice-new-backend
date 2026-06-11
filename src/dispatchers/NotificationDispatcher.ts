import { SESDispatcher } from '../integrations/SESDispatcher';
import { FCMDispatcher } from '../integrations/FCMDispatcher';
import { MSG91Dispatcher } from '../integrations/MSG91Dispatcher';
import { DeviceToken } from '../models/DeviceToken';
import { logger } from '../utils/logger';
import { InAppNotificationService } from '../services/InAppNotificationService';

export interface DispatchPayload {
  userId: string;
  channel: 'email' | 'push' | 'sms' |'inapp';
  userEmail?: string;
  userPhone?: string;
  subject?: string;
  body: string;
  title?: string;
  data?: Record<string, string>;
  dltTemplateId?: string;
}

export interface DispatchResult {
  success: boolean;
  channel: 'email' | 'push' | 'sms' |'inapp';
  providerResponse?: Record<string, unknown>;
  error?: string;
}

export class NotificationDispatcher {
  private ses: SESDispatcher;
  private fcm: FCMDispatcher;
  private msg91: MSG91Dispatcher;
  private inApp: InAppNotificationService;

  constructor() {
    this.ses = new SESDispatcher();
    this.fcm = new FCMDispatcher();
    this.msg91 = new MSG91Dispatcher();
    this.inApp = new InAppNotificationService();
  }

  async dispatch(payload: DispatchPayload): Promise<DispatchResult> {
    try {
      // switch (payload.channel) {
      //   case 'email':
      //     return await this.sendEmail(payload);
      //   case 'push':
      //     return await this.sendPush(payload);
      //   case 'sms':
      //     return await this.sendSMS(payload);
      //   default:
      //     throw new Error(`Unknown channel: ${payload.channel}`);
      // }


    switch (payload.channel) {
  case 'email':
    return await this.sendEmail(payload);

  case 'push':
    return await this.sendPush(payload);

  case 'sms':
    return await this.sendSMS(payload);

  case 'inapp':
    return await this.sendInApp(payload);

  default:
    throw new Error(`Unknown channel: ${payload.channel}`);
}




    } catch (error) {
      logger.error({ error, channel: payload.channel, userId: payload.userId }, 'Dispatch failed');
      return {
        success: false,
        channel: payload.channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendEmail(payload: DispatchPayload): Promise<DispatchResult> {
    if (!payload.userEmail) {
      return { success: false, channel: 'email', error: 'No email address' };
    }

    const result = await this.ses.send({
      to: payload.userEmail,
      subject: payload.subject || 'Notification',
      htmlBody: payload.body,
    });

    return { success: true, channel: 'email', providerResponse: result };
  }

  private async sendPush(payload: DispatchPayload): Promise<DispatchResult> {
    const deviceTokens = await DeviceToken.find({ userId: payload.userId, isActive: true }).lean();
    if (deviceTokens.length === 0) {
      return { success: false, channel: 'push', error: 'No device tokens' };
    }

    const results = await Promise.allSettled(
      deviceTokens.map((dt) =>
        this.fcm.send({
          token: dt.token,
          title: payload.title || 'Notification',
          body: payload.body,
          data: payload.data,
        })
      )
    );

    const success = results.some((r) => r.status === 'fulfilled');
    return { success, channel: 'push', providerResponse: { sent: deviceTokens.length } };
  }

  private async sendSMS(payload: DispatchPayload): Promise<DispatchResult> {
    if (!payload.userPhone) {
      return { success: false, channel: 'sms', error: 'No phone number' };
    }

    const result = await this.msg91.send({
      to: payload.userPhone,
      message: payload.body,
      dltTemplateId: payload.dltTemplateId,
    });

    return { success: true, channel: 'sms', providerResponse: result };
  }

private async sendInApp(
  payload: DispatchPayload
): Promise<DispatchResult> {
  await this.inApp.create({
    userId: payload.userId,
    event: payload.data?.event || 'UNKNOWN',
    title: payload.title || 'Notification',
    body: payload.body,
    type: payload.data?.type || 'general',
    metadata: payload.data || {},
  });

  return {
    success: true,
    channel: 'inapp',
  };
}
}
