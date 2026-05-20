import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface CalendarEventPayload {
  staffEmail: string;
  subject: string;
  body: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  isOnlineMeeting?: boolean;
}

export class MicrosoftGraphDispatcher {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const { tenantId, clientId, clientSecret } = config.microsoftGraph;
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    const response = await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  async sendCalendarUpdate(payload: CalendarEventPayload): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const graphUrl = `https://graph.microsoft.com/v1.0/users/${payload.staffEmail}/events`;

      await axios.post(
        graphUrl,
        {
          subject: payload.subject,
          body: { contentType: 'HTML', content: payload.body },
          start: { dateTime: payload.startDateTime, timeZone: 'Asia/Kolkata' },
          end: { dateTime: payload.endDateTime, timeZone: 'Asia/Kolkata' },
          location: payload.location ? { displayName: payload.location } : undefined,
          isOnlineMeeting: payload.isOnlineMeeting || false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info({ staffEmail: payload.staffEmail, subject: payload.subject }, 'Calendar event sent via MS Graph');
    } catch (error) {
      logger.error({ error, staffEmail: payload.staffEmail }, 'MS Graph calendar update failed');
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const graphUrl = `https://graph.microsoft.com/v1.0/users/${to}/sendMail`;

      await axios.post(
        graphUrl,
        {
          message: {
            subject,
            body: { contentType: 'HTML', content: body },
            toRecipients: [{ emailAddress: { address: to } }],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info({ to, subject }, 'Email sent via MS Graph');
    } catch (error) {
      logger.error({ error, to }, 'MS Graph email failed');
      throw error;
    }
  }
}
