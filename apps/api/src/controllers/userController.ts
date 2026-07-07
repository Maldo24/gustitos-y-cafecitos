import { Request, Response } from 'express';
import { userService } from '../services/userService.js';

export const userController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        res.status(400).json({ error: 'El nombre de usuario y el correo son requeridos' });
        return;
      }

      const newUser = await userService.createUser(username, email);
      res.status(201).json({
        message: 'Usuario registrado con éxito',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};