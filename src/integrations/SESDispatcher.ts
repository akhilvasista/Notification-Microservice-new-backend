import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export class SESDispatcher {
  private client: SESClient;

  constructor() {
    this.client = new SESClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  async send(payload: EmailPayload): Promise<{ messageId: string }> {
    const input: SendEmailCommandInput = {
      Source: `${config.aws.ses.fromName} <${config.aws.ses.fromEmail}>`,
      Destination: { ToAddresses: [payload.to] },
      Message: {
        Subject: { Data: payload.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: payload.htmlBody, Charset: 'UTF-8' },
          ...(payload.textBody && { Text: { Data: payload.textBody, Charset: 'UTF-8' } }),
        },
      },
    };

    try {
      const command = new SendEmailCommand(input);
      const response = await this.client.send(command);
      const messageId = response.MessageId || 'unknown';
      logger.info({ messageId, to: payload.to }, 'Email sent via SES');
      return { messageId };
    } catch (error) {
      logger.error({ error, to: payload.to }, 'SES email send failed');
      throw error;
    }
  }
}
