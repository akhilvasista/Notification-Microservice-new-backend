import { Request, Response, NextFunction } from 'express';
import { DeviceToken } from '../models/DeviceToken';
import { NotFoundError } from '../utils/errors';

export class DeviceController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, token, platform } = req.body;

      const device = await DeviceToken.findOneAndUpdate(
        { token },
        { userId, token, platform, isActive: true, lastUsedAt: new Date() },
        { upsert: true, new: true }
      );

      res.status(201).json({ success: true, data: device });
    } catch (error) {
      next(error);
    }
  };

  deregister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      await DeviceToken.findOneAndUpdate({ token }, { isActive: false });
      res.json({ success: true, message: 'Device token deregistered' });
    } catch (error) {
      next(error);
    }
  };

  getUserDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const devices = await DeviceToken.find({ userId: req.params.userId, isActive: true }).lean();
      res.json({ success: true, data: devices });
    } catch (error) {
      next(error);
    }
  };
}
