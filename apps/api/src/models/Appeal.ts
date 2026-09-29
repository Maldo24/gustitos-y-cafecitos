import { Schema, model, Document, Types } from 'mongoose';

export type AppealTargetType = 'group' | 'user';
export type AppealStatus = 'pending' | 'approved' | 'rejected';

export interface IAppeal extends Document {
  targetType: AppealTargetType;
  targetId: Types.ObjectId;
  targetLabel: string;        // Nombre del grupo o @usuario
  userId: Types.ObjectId;     // Dueño del recurso (quien apela)
  reason: string;             // Justificación escrita por el usuario
  status: AppealStatus;
  resolutionNote: string | null; // Respuesta del administrador
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

const AppealSchema = new Schema<IAppeal>({
  targetType: { type: String, required: true, enum: ['group', 'user'] },
  targetId: { type: Schema.Types.ObjectId, required: true, index: true },
  targetLabel: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true },
  status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  resolutionNote: { type: String, default: null },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

AppealSchema.index({ status: 1, createdAt: -1 });

export const Appeal = model<IAppeal>('Appeal', AppealSchema);
