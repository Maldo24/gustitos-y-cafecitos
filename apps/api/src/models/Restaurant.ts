import { Schema, model, Document, Types } from 'mongoose';

export interface IMemberReview {
  userId: Types.ObjectId;
  username: string;
  comment: string;
  createdAt: Date;
}

export interface IRestaurant extends Document {
  groupId: Types.ObjectId;
  name: string;
  mapsLink: string;
  categoryId: Types.ObjectId;
  memberReviews: IMemberReview[];
  votes: Types.ObjectId[];
  createdAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  name: { type: String, required: true },
  mapsLink: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  memberReviews: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

export const Restaurant = model<IRestaurant>('Restaurant', RestaurantSchema);