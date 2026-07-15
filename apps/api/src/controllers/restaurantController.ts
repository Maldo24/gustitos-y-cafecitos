import { Request, Response } from 'express';
import { restaurantService } from '../services/restaurantService.js';

export const restaurantController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, name, mapsLink, categoryId, comment, forceCreate } = req.body;
      const userId = (req as any).user?.userId; 

      // MEJORA: Exigimos mapsLink ya que lo definimos como obligatorio en la BD
      if (!groupId || !name || !categoryId || !mapsLink || !comment) {
        res.status(400).json({ error: 'Faltan campos obligatorios para registrar el restaurante (incluyendo mapsLink)' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const result = await restaurantService.createRestaurant(
        name,
        mapsLink, // Ya no necesitamos el "|| ''" porque verificamos arriba que exista
        categoryId,
        groupId,
        userId,
        comment,
        forceCreate 
      );

      // Si el servicio detecta similitudes, devolvemos 200 OK con el warning
      if (result.status === 'WARNING_SIMILAR') {
        res.status(200).json(result);
        return;
      }

      // Si se crea correctamente, devolvemos 201 Created
      res.status(201).json({ message: 'Restaurante sugerido con exito', restaurant: result.data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getByGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

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
  },

  async vote(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const userId = (req as any).user?.userId; 

      if (typeof restaurantId !== 'string') {
        res.status(400).json({ error: 'El ID del restaurante es invalido' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const updatedRestaurant = await restaurantService.toggleVote(restaurantId, userId);
      
      res.status(200).json({ 
        message: 'Voto registrado/actualizado correctamente', 
        votesCount: updatedRestaurant.votes.length, 
        restaurant: updatedRestaurant
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};