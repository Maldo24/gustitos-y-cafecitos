import { Router } from 'express';
import { restaurantController } from '../controllers/restaurantController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todos los endpoints de este archivo requerirán un token válido
router.use(authenticateToken);

// POST /api/restaurants - Registrar un restaurante en un grupo
router.post('/', restaurantController.create);

// GET /api/restaurants/group/:groupId - Listar restaurantes de un grupo
router.get('/group/:groupId', restaurantController.getByGroup);

// POST /api/restaurants/:restaurantId/reviews - Agregar reseña a un restaurante
router.post('/:restaurantId/reviews', restaurantController.addReview);

export default router;