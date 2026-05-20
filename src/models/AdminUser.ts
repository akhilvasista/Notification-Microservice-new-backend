import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IAdminUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): boolean;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'viewer'],
      default: 'admin',
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

AdminUserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = crypto.createHash('sha256').update(this.password).digest('hex');
  }
  next();
});

AdminUserSchema.methods.comparePassword = function (password: string): boolean {
  const hashed = crypto.createHash('sha256').update(password).digest('hex');
  return this.password === hashed;
};

export const AdminUser: Model<IAdminUser> = mongoose.model(
  'AdminUser',
  AdminUserSchema,
  'admin_users'
);
