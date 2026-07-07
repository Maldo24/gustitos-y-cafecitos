import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService.js';

export const categoryController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name) {
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

  async list(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};