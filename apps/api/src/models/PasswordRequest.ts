import { Schema, model, Document, Types } from 'mongoose';

export type PasswordRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface IPasswordRequest extends Document {
  userId: Types.ObjectId;
  username: string;
  email: string;
  status: PasswordRequestStatus;
  token: string | null;        // Se genera al aprobar (un solo uso)
  expiresAt: Date | null;      // 30 minutos desde la aprobación
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

const PasswordRequestSchema = new Schema<IPasswordRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  token: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

PasswordRequestSchema.index({ createdAt: -1 });
// Evita acumulación de solicitudes vivas del mismo usuario
PasswordRequestSchema.index(
  { userId: 1, status: 1 },
  { unique: false, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);

export const PasswordRequest = model<IPasswordRequest>('PasswordRequest', PasswordRequestSchema);
