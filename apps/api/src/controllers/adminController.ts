import { Request, Response } from 'express';
import { adminService } from '../services/adminService.js';
import { passwordRequestService } from '../services/passwordRequestService.js';

export const adminController = {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminService.getStats();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await adminService.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const requesterId = (req as any).user?.userId;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'El ID del usuario es requerido' });
        return;
      }

      if (role !== 'admin' && role !== 'user') {
        res.status(400).json({ error: 'El rol debe ser "admin" o "user"' });
        return;
      }

      if (requesterId && requesterId === id) {
        res.status(400).json({ error: 'No puedes cambiar tu propio rol de administrador' });
        return;
      }

      const updatedUser = await adminService.setUserRole(id, role);
      res.status(200).json({ message: 'Rol actualizado con exito', user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async listGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await adminService.getAllGroups();
      res.status(200).json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async listPasswordRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await passwordRequestService.listRequests();
      res.status(200).json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async reviewPasswordRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const adminId = (req as any).user?.userId;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'El ID de la solicitud es requerido' });
        return;
      }

      if (action !== 'approve' && action !== 'reject') {
        res.status(400).json({ error: 'La acción debe ser "approve" o "reject"' });
        return;
      }

      if (!adminId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const request = await passwordRequestService.reviewRequest(id, adminId, action);

      res.status(200).json({
        message: action === 'approve'
          ? 'Solicitud aprobada. El usuario ya puede definir su nueva contraseña.'
          : 'Solicitud rechazada.',
        request
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};