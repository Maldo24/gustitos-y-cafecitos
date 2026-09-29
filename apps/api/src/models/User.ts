import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  names: string;
  firstSurname: string;
  email: string;
  role: 'admin' | 'user';
  blocked: boolean; // Bloqueo reversible: el usuario conserva su cuenta
  blockedAt: Date | null;
  blockedBy: Types.ObjectId | null;
  blockReason: string | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  names: { type: String, required: true },
  firstSurname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  blocked: { type: Boolean, default: false, index: true },
  blockedAt: { type: Date, default: null },
  blockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  blockReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', UserSchema);