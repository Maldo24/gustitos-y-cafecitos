import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';

export const sessionController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, splitMode, tipPercentage, participants, groupId } = req.body;

      if (!title || !splitMode || !participants || !Array.isArray(participants)) {
        res.status(400).json({ error: 'Los campos title, splitMode y un arreglo de participants son requeridos' });
        return;
      }

      const session = await sessionService.createSession(title, splitMode, tipPercentage || 0, participants, groupId);
      res.status(201).json({ message: 'Sesion de cuenta calculada y guardada con exito', session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async listByGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      if (typeof groupId !== 'string') {
        res.status(400).json({ error: 'El identificador del grupo no es valido' });
        return;
      }

      const sessions = await sessionService.getSessionsByGroup(groupId);
      res.status(200).json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      // Solución Error 1: Validamos que sessionId sea un string antes de usarlo
      if (typeof sessionId !== 'string') {
        res.status(400).json({ error: 'El identificador de la sesión no es válido' });
        return;
      }

      const session = await sessionService.getSessionById(sessionId);
      res.status(200).json(session);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async togglePayment(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, participantId } = req.params;

      // Solución Error 2: Validamos que ambos identificadores sean strings
      if (typeof sessionId !== 'string' || typeof participantId !== 'string') {
        res.status(400).json({ error: 'Los identificadores de sesión y participante deben ser válidos' });
        return;
      }

      const updatedSession = await sessionService.toggleParticipantPayment(sessionId, participantId);
      res.status(200).json({ 
        message: 'Estado de pago actualizado correctamente', 
        session: updatedSession 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};