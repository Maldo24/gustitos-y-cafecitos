import { Session, ISession, ISessionParticipant } from '../models/Session.js';
import { Group } from '../models/Group.js';

export const sessionService = {
  /**
   * Crea una nueva sesion de cuenta compartida y calcula automaticamente el pago final por persona.
   */
  async createSession(
    title: string,
    splitMode: 'equal' | 'by_consumption',
    tipPercentage: number,
    participants: ISessionParticipant[],
    groupId?: string
  ): Promise<ISession> {
    
    // 1. Si se provee un groupId, validar que el grupo exista
    if (groupId) {
      const groupExists = await Group.findById(groupId);
      if (!groupExists) throw new Error('El grupo especificado no existe');
    }

    // 2. Calcular los montos por participante
    let totalAmount = 0;

    // Calcular primero el consumo neto de cada uno
    participants.forEach(p => {
      let subtotal = 0;
      p.itemsConsumed.forEach(item => {
        subtotal += item.price * item.quantity;
      });
      p.finalPay = subtotal; // Guardado temporal sin propina
      totalAmount += subtotal;
    });

    // 3. Aplicar la division segun el modo seleccionado
    const tipFactor = 1 + (tipPercentage / 100);

    if (splitMode === 'equal') {
      // Division equitativa: Total con propina dividido entre todos por igual
      const totalWithTip = totalAmount * tipFactor;
      const sharePerPerson = totalWithTip / participants.length;

      participants.forEach(p => {
        p.finalPay = Math.round(sharePerPerson * 100) / 100; // Redondeo a 2 decimales
      });
      
      totalAmount = totalWithTip;
    } else {
      // Division por consumo: Cada uno paga lo que comio + su porcentaje de propina
      participants.forEach(p => {
        const individualWithTip = p.finalPay * tipFactor;
        p.finalPay = Math.round(individualWithTip * 100) / 100;
      });

      totalAmount = totalAmount * tipFactor;
    }

    // 4. Guardar la sesion calculada en la base de datos
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

  /**
   * Obtiene el historial de sesiones asociadas a un grupo especifico.
   */
  async getSessionsByGroup(groupId: string): Promise<ISession[]> {
    return await Session.find({ groupId }).sort({ createdAt: -1 }); // De la mas reciente a la mas antigua
  }
};