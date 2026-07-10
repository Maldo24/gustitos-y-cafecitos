import { Request, Response } from 'express';
import { authService } from '../services/authService.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, names, firstSurname, email } = req.body;

      if (!username || !password || !names || !firstSurname || !email) {
        res.status(400).json({ error: 'Faltan campos obligatorios' });
        return;
      }

      const user = await authService.registerUser(username, password, names, firstSurname, email);
      res.status(201).json({ message: 'Usuario registrado correctamente', userId: user._id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Faltan campos obligatorios' });
        return;
      }

      const { user, accessToken } = await authService.loginUser(username, password);

      res.status(200).json({
        success: true,
        message: `Inicio de sesion exitoso del usuario ${user.username}`,
        user: {
          username: user.username,
          names: user.names,
          firstSurname: user.firstSurname,
          email: user.email
        },
        accessToken
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
};