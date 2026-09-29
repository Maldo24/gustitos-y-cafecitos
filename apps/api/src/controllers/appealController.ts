import { Request, Response } from 'express';
import { appealService } from '../services/appealService.js';

export const appealController = {
  /**
   * POST /api/appeals - Crear una apelación.
   * Acepta dos modalidades:
   *  - con token: apela la eliminación de un grupo del que eres miembro
   *  - sin token: apela tu propio bloqueo con usuario + correo
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { targetType, targetId, reason, username, email } = req.body;
      const requesterId = (req as any).user?.userId;

      if (targetType !== 'group' && targetType !== 'user') {
        res.status(400).json({ error: 'targetType debe ser "group" o "user"' });
        return;
      }

      if (!reason) {
        res.status(400).json({ error: 'La justificación es obligatoria' });
        return;
      }

      // Para un grupo necesitamos el ID; para un bloqueo el usuario se
      // identifica solo con usuario + correo, así que el targetId se resuelve
      // en el servicio.
      if (targetType === 'group' && !targetId) {
        res.status(400).json({ error: 'El ID del grupo es requerido' });
        return;
      }

      if (targetType === 'user' && !requesterId && (!username || !email)) {
        res.status(400).json({ error: 'Necesitas iniciar sesión o indicar tu usuario y correo' });
        return;
      }

      const appeal = await appealService.createAppeal({
        targetType,
        targetId,
        reason,
        requesterId,
        username,
        email
      });

      res.status(201).json({ message: 'Tu apelación fue enviada a revisión', appeal });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  /** GET /api/appeals/mine - Mis apelaciones */
  async listMine(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const appeals = await appealService.listMine(userId);
      res.status(200).json(appeals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
