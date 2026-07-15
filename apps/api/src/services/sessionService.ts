import { Session, ISession, ISessionParticipant } from '../models/Session.js';
import { Group } from '../models/Group.js';

export const sessionService = {
  
  async createSession(
    title: string,
    splitMode: 'equal' | 'by_consumption',
    tipPercentage: number,
    participants: ISessionParticipant[],
    groupId?: string
  ): Promise<ISession> {
    
    if (groupId) {
      const groupExists = await Group.findById(groupId);
      if (!groupExists) throw new Error('El grupo especificado no existe');
    }

    let totalAmount = 0;

    participants.forEach(p => {
      let subtotal = 0;
      p.itemsConsumed.forEach(item => {
        subtotal += item.price * item.quantity;
      });
      p.finalPay = subtotal; 
      totalAmount += subtotal;
      p.isPaid = false; // Nos aseguramos de que inicialice en falso
    });

    const tipFactor = 1 + (tipPercentage / 100);

    if (splitMode === 'equal') {
      const totalWithTip = totalAmount * tipFactor;
      const sharePerPerson = totalWithTip / participants.length;

      participants.forEach(p => {
        p.finalPay = Math.round(sharePerPerson * 100) / 100; 
      });
      
      totalAmount = totalWithTip;
    } else {
      participants.forEach(p => {
        const individualWithTip = p.finalPay * tipFactor;
        p.finalPay = Math.round(individualWithTip * 100) / 100;
      });

      totalAmount = totalAmount * tipFactor;
    }

    const newSession = new Session({
      groupId: groupId || undefined,
      title,
      totalAmount: Math.round(totalAmount * 100) / 100,
      tipPercentage,
      splitMode,
      participants
    });

    return await newSession.save();
  },

  async getSessionsByGroup(groupId: string): Promise<ISession[]> {
    return await Session.find({ groupId }).sort({ createdAt: -1 }); 
  },

  // <-- NUEVO: Obtener el detalle de una sola sesión
  async getSessionById(sessionId: string): Promise<ISession> {
    const session = await Session.findById(sessionId);
    if (!session) throw new Error('La sesión especificada no existe');
    return session;
  },

  // <-- NUEVO: Alternar el estado de pago de un participante
  async toggleParticipantPayment(sessionId: string, participantId: string): Promise<ISession> {
    const session = await Session.findById(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    // Buscamos al participante dentro del arreglo por su _id de subdocumento
    const participant = session.participants.find(p => p._id?.toString() === participantId.toString());
    
    if (!participant) {
      throw new Error('Participante no encontrado en esta sesión');
    }

    // Alternamos el estado (si era true pasa a false y viceversa)
    participant.isPaid = !participant.isPaid;
    
    return await session.save();
  }
};