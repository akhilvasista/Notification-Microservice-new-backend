import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { formatPhoneNumber } from '../utils/helpers';

export interface SMSPayload {
  to: string;
  message: string;
  dltTemplateId?: string;
}

export class MSG91Dispatcher {
  private readonly baseUrl = 'https://api.msg91.com/api/v5';

  async send(payload: SMSPayload): Promise<{ requestId: string }> {
    const phone = formatPhoneNumber(payload.to);

    const requestBody = {
      template_id: payload.dltTemplateId || config.msg91.dltTeId,
      recipients: [
        {
          mobiles: phone,
          var1: payload.message, // For flow-based templates
        },
      ],
      sender: config.msg91.senderId,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/flow/`, requestBody, {
        headers: {
          authkey: config.msg91.authKey,
          'Content-Type': 'application/JSON',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const requestId = response.data?.request_id || 'unknown';
      logger.info({ requestId, phone }, 'SMS sent via MSG91');
      return { requestId };
    } catch (error) {
      logger.error({ error, phone }, 'MSG91 SMS send failed');
      throw error;
    }
  }

  async sendBulk(messages: SMSPayload[]): Promise<void> {
    // Process in batches of 50 for MSG91 bulk API
    for (const msg of messages) {
      await this.send(msg);
    }
  }
}
