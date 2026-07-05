import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  mapsLink: string;
  categoryId: Types.ObjectId; // Referencia a la colección de Categorías
  review?: string;
  votes: number;
  createdAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>({
  name: { type: String, required: true },
  mapsLink: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  review: { type: String, default: "" },
  votes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Restaurant = model<IRestaurant>('Restaurant', RestaurantSchema);