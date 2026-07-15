import { Schema, model, Document, Types } from 'mongoose';

export interface IItemConsumed {
  dishName: string;
  price: number;
  quantity: number;
}

export interface ISessionParticipant {
  _id?: Types.ObjectId; // Útil para que Mongoose identifique este subdocumento
  name: string;
  userId?: Types.ObjectId;
  itemsConsumed: IItemConsumed[];
  finalPay: number;
  isPaid: boolean; // <-- NUEVO: Control de estado de pago
}

export interface ISession extends Document {
  groupId?: Types.ObjectId;
  title: string;
  totalAmount: number;
  tipPercentage: number;
  splitMode: 'equal' | 'by_consumption';
  participants: ISessionParticipant[];
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: false },
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  tipPercentage: { type: Number, default: 0 },
  splitMode: { 
    type: String, 
    enum: ['equal', 'by_consumption'], 
    required: true 
  },
  participants: [
    {
      name: { type: String, required: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
      itemsConsumed: [
        {
          dishName: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true, default: 1 }
        }
      ],
      finalPay: { type: Number, required: true, default: 0 },
      isPaid: { type: Boolean, default: false } // <-- NUEVO: Por defecto nadie ha pagado
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export const Session = model<ISession>('Session', SessionSchema);