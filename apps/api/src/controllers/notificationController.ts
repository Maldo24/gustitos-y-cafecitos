import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  /** GET /api/notifications - Lista las notificaciones del usuario */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { limit } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const notifications = await notificationService.listForUser(userId, Number(limit) || 20);
      res.status(200).json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  /** GET /api/notifications/unread-count - Contador para la campana */
  async unreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const count = await notificationService.countUnread(userId);
      res.status(200).json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  /** PATCH /api/notifications/:id/read - Marcar una como leída */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'El ID de la notificación es requerido' });
        return;
      }

      const notification = await notificationService.markAsRead(userId, id);

      if (!notification) {
        res.status(404).json({ error: 'Notificación no encontrada' });
        return;
      }

      res.status(200).json({ message: 'Notificación marcada como leída', notification });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  /** POST /api/notifications/read-all - Marcar todas como leídas */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const updated = await notificationService.markAllAsRead(userId);
      res.status(200).json({ message: 'Notificaciones marcadas como leídas', updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
