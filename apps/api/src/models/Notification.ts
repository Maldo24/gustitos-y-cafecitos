import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'member_joined'
  | 'member_added'
  | 'user_blocked'
  | 'user_unblocked'
  | 'group_deleted';

export interface INotification extends Document {
  userId: Types.ObjectId;          // Quién recibe el aviso
  type: NotificationType;
  message: string;
  link: string | null;             // Ruta del frontend, ej. /grupo/mi-grupo-a1b2
  actorName: string | null;        // Quién provocó el aviso
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, enum: ['member_joined', 'member_added', 'user_blocked', 'user_unblocked', 'group_deleted'] },
  message: { type: String, required: true },
  link: { type: String, default: null },
  actorName: { type: String, default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Consulta principal: no leídas de un usuario, recientes primero
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
