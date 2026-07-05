import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string; // Ej: "Cafetería"
  slug: string; // Ej: "cafeteria"
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }
});

export const Category = model<ICategory>('Category', CategorySchema);