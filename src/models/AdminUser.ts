import mongoose, { Document, Model, Schema } from 'mongoose';
import crypto from 'crypto';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;

export interface IAdminUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const deriveKey = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      }
    );
  });

const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  const derivedKey = await deriveKey(password, salt);
  return `scrypt$${SCRYPT_COST}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
};

const safeEqual = (left: Buffer, right: Buffer): boolean =>
  left.length === right.length && crypto.timingSafeEqual(left, right);

const isValidScryptHash = (value: string): boolean => {
  const [algorithm, cost, saltHex, hashHex] = value.split('$');
  return (
    algorithm === 'scrypt' &&
    Number(cost) === SCRYPT_COST &&
    /^[a-f0-9]{32}$/i.test(saltHex || '') &&
    /^[a-f0-9]{128}$/i.test(hashHex || '')
  );
};

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
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

// Hash newly supplied passwords before they are persisted.
AdminUserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  if (isValidScryptHash(this.password)) {
    return;
  }

  this.password = await hashPassword(this.password);
});

AdminUserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const storedPassword = this.password;

  if (storedPassword.startsWith('scrypt$')) {
    if (!isValidScryptHash(storedPassword)) {
      return false;
    }

    const [, , saltHex, hashHex] = storedPassword.split('$');
    const expectedHash = Buffer.from(hashHex, 'hex');
    const actualHash = await deriveKey(candidatePassword, Buffer.from(saltHex, 'hex'));
    return safeEqual(actualHash, expectedHash);
  }

  // One-time migration path for existing SHA-256 password records.
  if (/^[a-f0-9]{64}$/i.test(storedPassword)) {
    const legacyHash = crypto.createHash('sha256').update(candidatePassword).digest();
    const storedHash = Buffer.from(storedPassword, 'hex');

    if (!safeEqual(legacyHash, storedHash)) {
      return false;
    }

    this.password = candidatePassword;
    await this.save();
    return true;
  }

  return false;
};

export const AdminUser: Model<IAdminUser> = mongoose.model(
  'AdminUser',
  AdminUserSchema,
  'admin_users'
);
