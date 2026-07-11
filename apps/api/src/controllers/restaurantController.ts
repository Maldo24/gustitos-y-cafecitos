import { Request, Response } from 'express';
import { restaurantService } from '../services/restaurantService.js';

export const restaurantController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, name, mapsLink, categoryId, comment } = req.body;
      const userId = (req as any).user?.userId; 

      if (!groupId || !name || !categoryId || !comment) {
        res.status(400).json({ error: 'Faltan campos obligatorios para registrar el restaurante' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Solución error 1: Pasamos los argumentos sueltos en el orden del servicio
      const restaurant = await restaurantService.createRestaurant(
        name,
        mapsLink || '', // Si no hay link, mandamos string vacío
        categoryId,
        groupId,
        userId,
        comment
      );

      res.status(201).json({ message: 'Restaurante sugerido con exito', restaurant });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getByGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      // Solución error 2: Forzamos a TypeScript a tratar groupId como string
      if (typeof groupId !== 'string') {
        res.status(400).json({ error: 'El groupId no es valido' });
        return;
      }

      const restaurants = await restaurantService.getRestaurantsByGroup(groupId);
      res.status(200).json(restaurants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async addReview(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const { comment } = req.body;
      const userId = (req as any).user?.userId; 

      // Validamos explícitamente que restaurantId sea un string
      if (typeof restaurantId !== 'string' || !comment) {
        res.status(400).json({ error: 'El ID del restaurante y el comentario son requeridos' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const restaurant = await restaurantService.addReviewToRestaurant(restaurantId, userId, comment);
      res.status(200).json({ message: 'Resena agregada con exito', restaurant });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};