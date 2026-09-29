import { Request, Response } from 'express';
import { passwordRequestService } from '../services/passwordRequestService.js';

export const passwordRequestController = {
  /** POST /api/auth/password-requests - El usuario solicita el cambio */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        res.status(400).json({ error: 'El usuario y el correo son requeridos' });
        return;
      }

      const result = await passwordRequestService.createRequest(username, email);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  /** POST /api/auth/password-requests/status - Consultar estado de mi solicitud */
  async status(req: Request, res: Response): Promise<void> {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        res.status(400).json({ error: 'El usuario y el correo son requeridos' });
        return;
      }

      const result = await passwordRequestService.getStatus(username, email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  /** POST /api/auth/password-requests/confirm - Definir la nueva contraseña */
  async confirm(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'El código y la nueva contraseña son requeridos' });
        return;
      }

      const result = await passwordRequestService.confirmPasswordChange(token, newPassword);
      res.status(200).json({
        message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
        username: result.username
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
