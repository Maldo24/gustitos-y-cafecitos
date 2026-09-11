import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/categories - Crear una categoria (solo admin)
router.post('/', authenticateToken, requireAdmin, categoryController.create);

// PUT /api/categories/:id - Actualizar una categoria (solo admin)
router.put('/:id', authenticateToken, requireAdmin, categoryController.update);

// DELETE /api/categories/:id - Eliminar una categoria (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, categoryController.remove);

// GET /api/categories - Obtener todas las categorias
router.get('/', categoryController.list);

export default router;