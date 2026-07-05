import { Schema, model, Document, Types } from 'mongoose';

export interface IDish extends Document {
  restaurantId: Types.ObjectId; // Referencia al restaurante dueño del plato
  dishName: string;
  price: number;
  review?: string;
  createdAt: Date;
}

const DishSchema = new Schema<IDish>({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  dishName: { type: String, required: true },
  price: { type: Number, required: true },
  review: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const Dish = model<IDish>('Dish', DishSchema);