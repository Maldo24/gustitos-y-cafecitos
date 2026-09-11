import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService.js';

export const categoryController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'El nombre de la categoria es requerido' });
        return;
      }

      const newCategory = await categoryService.createCategory(name);
      res.status(201).json({
        message: 'Categoria creada con exito',
        category: newCategory
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'El ID de la categoria es requerido' });
        return;
      }

      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'El nombre de la categoria es requerido' });
        return;
      }

      const updatedCategory = await categoryService.updateCategory(id, name);
      res.status(200).json({
        message: 'Categoria actualizada con exito',
        category: updatedCategory
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'El ID de la categoria es requerido' });
        return;
      }

      await categoryService.deleteCategory(id);
      res.status(200).json({ message: 'Categoria eliminada con exito' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async list(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};