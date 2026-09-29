import { Schema, model, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  slug: string;
  name: string;
  adminId: Types.ObjectId | null; // Creador del grupo (admin)
  members: Types.ObjectId[]; // Lista de IDs de la colección de Usuarios
  savedRestaurants: Types.ObjectId[]; // Lista de IDs de la colección de Restaurantes
  status: 'active' | 'deleted'; // Borrado lógico: permite restaurar tras una apelación
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;
  deletionReason: string | null;
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  savedRestaurants: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }],
  status: { type: String, enum: ['active', 'deleted'], default: 'active', index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  deletionReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const Group = model<IGroup>('Group', GroupSchema);