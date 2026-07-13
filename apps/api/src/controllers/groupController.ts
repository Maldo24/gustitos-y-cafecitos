import { Request, Response } from 'express';
import { groupService } from '../services/groupService.js';

export const groupController = {

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      // Usamos as any para saltar el validador estricto del editor
      const creatorId = (req as any).user?.userId; 

      if (!name) {
        res.status(400).json({ error: 'El nombre del grupo es requerido' });
        return;
      }

      if (!creatorId) {
        res.status(401).json({ error: 'Usuario no autenticado en el token' });
        return;
      }

      const newGroup = await groupService.createGroup(name, creatorId);
      res.status(201).json({ message: 'Grupo creado con exito', group: newGroup });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      if (typeof slug !== 'string') {
        res.status(400).json({ error: 'El identificador slug no es valido' });
        return;
      }

      const group = await groupService.getGroupBySlug(slug);
      if (!group) {
        res.status(404).json({ error: 'Grupo no encontrado' });
        return;
      }

      res.status(200).json(group);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async suggestRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const { restaurantId } = req.body;

      if (typeof slug !== 'string' || !restaurantId) {
        res.status(400).json({ error: 'El slug del grupo y el restaurantId son requeridos' });
        return;
      }

      const updatedGroup = await groupService.addRestaurantToGroup(slug, restaurantId);
      res.status(200).json({ message: 'Restaurante sugerido con exito', group: updatedGroup });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { username } = req.body; 

      if (typeof groupId !== 'string' || !username) {
        res.status(400).json({ error: 'El ID del grupo y el username del amigo son requeridos' });
        return;
      }

      const group = await groupService.addMemberToGroup(groupId, username);
      res.status(200).json({ message: 'Amigo agregado al grupo con exito', group });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
  async getMyGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const groups = await groupService.getGroupsByUser(userId);
      res.status(200).json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      if (typeof groupId !== 'string') {
        res.status(400).json({ error: 'El ID del grupo es requerido' });
        return;
      }

      const members = await groupService.getGroupMembers(groupId);
      res.status(200).json(members);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
};