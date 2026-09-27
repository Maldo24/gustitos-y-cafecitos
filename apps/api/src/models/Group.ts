import { Schema, model, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  slug: string;
  name: string;
  adminId: Types.ObjectId | null; // Creador del grupo (admin)
  members: Types.ObjectId[]; // Lista de IDs de la colección de Usuarios
  savedRestaurants: Types.ObjectId[]; // Lista de IDs de la colección de Restaurantes
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  savedRestaurants: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }],
  createdAt: { type: Date, default: Date.now }
});

export const Group = model<IGroup>('Group', GroupSchema);