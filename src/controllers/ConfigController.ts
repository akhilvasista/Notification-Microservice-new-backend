import { Request, Response, NextFunction } from 'express';
import { NotificationConfig } from '../models/NotificationConfig';
import { NotFoundError } from '../utils/errors';

export class ConfigController {
  /**
   * @swagger
   * /api/admin/configs:
   *   post:
   *     summary: Create notification config
   *     tags: [Admin - Configs]
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await NotificationConfig.create(req.body);
      res.status(201).json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/admin/configs:
   *   get:
   *     summary: List all notification configs
   *     tags: [Admin - Configs]
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { event, isActive, page = 1, limit = 20 } = req.query;
      const query: Record<string, unknown> = {};
      if (event) query.event = event;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const skip = (Number(page) - 1) * Number(limit);
      const [docs, total] = await Promise.all([
        NotificationConfig.find(query).skip(skip).limit(Number(limit)).lean(),
        NotificationConfig.countDocuments(query),
      ]);

      res.json({ success: true, data: { docs, total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/admin/configs/{id}:
   *   get:
   *     summary: Get notification config by ID
   *     tags: [Admin - Configs]
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await NotificationConfig.findById(req.params.id).lean();
      if (!config) throw new NotFoundError('Notification config');
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/admin/configs/{id}:
   *   put:
   *     summary: Update notification config
   *     tags: [Admin - Configs]
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await NotificationConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!config) throw new NotFoundError('Notification config');
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/admin/configs/{id}:
   *   delete:
   *     summary: Delete notification config
   *     tags: [Admin - Configs]
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await NotificationConfig.findByIdAndDelete(req.params.id);
      if (!config) throw new NotFoundError('Notification config');
      res.json({ success: true, message: 'Config deleted' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/admin/configs/{id}/toggle:
   *   patch:
   *     summary: Pause or resume a notification config
   *     tags: [Admin - Configs]
   */
  toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await NotificationConfig.findById(req.params.id);
      if (!config) throw new NotFoundError('Notification config');
      config.isActive = !config.isActive;
      await config.save();
      res.json({ success: true, data: { isActive: config.isActive } });
    } catch (error) {
      next(error);
    }
  };
}
