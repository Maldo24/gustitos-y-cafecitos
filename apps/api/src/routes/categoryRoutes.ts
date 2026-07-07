import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';

const router = Router();

// POST /api/categories - Crear una categoria
router.post('/', categoryController.create);

// GET /api/categories - Obtener todas las categorias
router.get('/', categoryController.list);

export default router;