import { Request, Response } from 'express';
import { restaurantService } from '../services/restaurantService.js';

export const restaurantController = {
  async createRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const { name, mapsLink, categoryId, groupId, creatorId, initialComment } = req.body;

      if (!name || !mapsLink || !categoryId || !groupId) {
        res.status(400).json({ error: 'Los campos name, mapsLink, categoryId y groupId son requeridos' });
        return;
      }

      const restaurant = await restaurantService.createRestaurant(
        name, 
        mapsLink, 
        categoryId, 
        groupId, 
        creatorId, 
        initialComment
      );
      res.status(201).json({ message: 'Restaurante registrado en el grupo con exito', restaurant });
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

      const restaurants = await restaurantService.getRestaurantsByGroup(groupId);
      res.status(200).json(restaurants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async addMemberReview(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const { userId, comment } = req.body;

      if (typeof restaurantId !== 'string' || !userId || !comment) {
        res.status(400).json({ error: 'El restaurantId, userId y comment son requeridos' });
        return;
      }

      const updatedRestaurant = await restaurantService.addReviewToRestaurant(restaurantId, userId, comment);
      if (!updatedRestaurant) {
        res.status(404).json({ error: 'Restaurante no encontrado' });
        return;
      }

      res.status(200).json({ message: 'Reseña agregada con exito', restaurant: updatedRestaurant });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};