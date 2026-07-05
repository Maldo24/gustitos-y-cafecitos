import { Schema, model, Document, Types } from 'mongoose';

export interface IItemConsumed {
  dishName: string;
  price: number;
  quantity: number;
}

export interface ISessionParticipant {
  name: string; // Puede ser el username de un User, o un texto para invitados anónimos
  userId?: Types.ObjectId; // Opcional, por si es un usuario registrado
  itemsConsumed: IItemConsumed[]; // Detalle plano de lo que comió esa noche
  finalPay: number; // Monto total calculado a pagar por esta persona
}

export interface ISession extends Document {
  groupId?: Types.ObjectId; // Opcional. Si es null, significa que es una salida espontánea
  title: string; // Ej: "Almuerzo espontáneo Oficina"
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
      finalPay: { type: Number, required: true, default: 0 }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export const Session = model<ISession>('Session', SessionSchema);