import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser';
import { config } from '../config';
import { UnauthorizedError, ValidationError } from '../utils/errors';

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError('Email and password required');

      const admin = await AdminUser.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
      if (!admin || !admin.comparePassword(password)) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const token = jwt.sign(
        { id: String(admin._id), email: admin.email, role: admin.role },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      await AdminUser.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() });

      res.json({
        success: true,
        data: {
          token,
          admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request & { admin?: { id: string } }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = await AdminUser.findById(req.admin!.id).select('-password');
      res.json({ success: true, data: admin });
    } catch (error) {
      next(error);
    }
  };
}
