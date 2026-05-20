import { Request, Response, NextFunction } from 'express';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { TemplateEngine } from '../templates/TemplateEngine';
import { NotFoundError } from '../utils/errors';

const templateEngine = new TemplateEngine();

export class TemplateController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await NotificationTemplate.create(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, isActive } = req.query;
      const query: Record<string, unknown> = {};
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const templates = await NotificationTemplate.find(query).lean();
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await NotificationTemplate.findOne({ templateId: req.params.templateId }).lean();
      if (!template) throw new NotFoundError('Template');
      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await NotificationTemplate.findOneAndUpdate(
        { templateId: req.params.templateId },
        { ...req.body, $inc: { version: 1 } },
        { new: true, runValidators: true }
      );
      if (!template) throw new NotFoundError('Template');

      // Invalidate template cache
      templateEngine.invalidateCache(req.params.templateId);

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await NotificationTemplate.findOneAndDelete({ templateId: req.params.templateId });
      if (!template) throw new NotFoundError('Template');
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  };

  preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { templateId } = req.params;
      const { context = {} } = req.body;
      const rendered = await templateEngine.render(templateId, context);
      res.json({ success: true, data: rendered });
    } catch (error) {
      next(error);
    }
  };
}
