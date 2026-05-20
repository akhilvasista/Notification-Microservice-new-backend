import Handlebars from 'handlebars';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export class TemplateEngine {
  private cache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: string) =>
      new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    );

    Handlebars.registerHelper('formatTime', (date: string) =>
      new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );

    Handlebars.registerHelper('capitalize', (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
    );

    // Avoid 'this' implicit any by using explicit function signature
    Handlebars.registerHelper('ifEqual', function ifEqual(
      a: unknown,
      b: unknown,
      options: Handlebars.HelperOptions
    ) {
      if (a === b) return options.fn({});
      return options.inverse({});
    });
  }

  async render(
    templateId: string,
    context: Record<string, unknown>
  ): Promise<{ subject?: string; body: string; title?: string }> {
    const template = await this.fetchTemplate(templateId);

    try {
      const compiledBody = this.compile(`${templateId}:body`, template.body);
      const body = compiledBody(context);

      const subject = template.subject
        ? this.compile(`${templateId}:subject`, template.subject)(context)
        : undefined;

      const title = template.title
        ? this.compile(`${templateId}:title`, template.title)(context)
        : undefined;

      return { subject, body, title };
    } catch (error) {
      logger.error({ error, templateId }, 'Template render error');
      throw error;
    }
  }

  private compile(cacheKey: string, source: string): HandlebarsTemplateDelegate {
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, Handlebars.compile(source));
    }
    return this.cache.get(cacheKey)!;
  }

  private async fetchTemplate(templateId: string): Promise<{
    body: string;
    subject?: string;
    title?: string;
    isActive: boolean;
  }> {
    const template = await NotificationTemplate.findOne({ templateId, isActive: true }).lean();
    if (!template) throw new NotFoundError(`Template: ${templateId}`);
    return template as { body: string; subject?: string; title?: string; isActive: boolean };
  }

  invalidateCache(templateId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(templateId)) this.cache.delete(key);
    }
  }
}
