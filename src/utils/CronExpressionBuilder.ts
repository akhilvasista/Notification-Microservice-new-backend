interface OccurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

  interval?: number;

  times?: string[];

  daysOfWeek?: number[];

  daysOfMonth?: number[];
}

interface ScheduleConfig {
  occurrence?: OccurrenceConfig;
}

export class CronExpressionBuilder {
  static build(schedule: ScheduleConfig): string[] {
    if (!schedule.occurrence) {
      throw new Error('Occurrence configuration missing');
    }

    const {
      frequency,
      interval = 1,
      times = ['09:00'],
      daysOfWeek = [],
      daysOfMonth = [],
    } = schedule.occurrence;

    const cronExpressions: string[] = [];

    for (const time of times) {
      const [hourStr, minuteStr] = time.split(':');

      const hour = Number(hourStr);

      const minute = Number(minuteStr);

      switch (frequency) {
        case 'daily':
          cronExpressions.push(
            `${minute} ${hour} */${interval} * *`
          );
          break;

        case 'weekly':
          cronExpressions.push(
            `${minute} ${hour} * * ${daysOfWeek.join(',')}`
          );
          break;

        case 'monthly':
          cronExpressions.push(
            `${minute} ${hour} ${daysOfMonth.join(',')} */${interval} *`
          );
          break;

        case 'yearly':
          cronExpressions.push(
            `${minute} ${hour} 1 1 *`
          );
          break;

        default:
          throw new Error(`Unsupported frequency: ${frequency}`);
      }
    }

    return cronExpressions;
  }
}