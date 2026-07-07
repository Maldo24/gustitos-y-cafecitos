import { Router } from 'express';
import { restaurantController } from '../controllers/restaurantController.js';

const router = Router();

// Crear restaurante en un grupo
router.post('/', restaurantController.createRestaurant);

// Listar los restaurantes de un grupo especifico
router.get('/group/:groupId', restaurantController.listByGroup);

// Agregar la reseña de un integrante a un restaurante existente
router.post('/:restaurantId/reviews', restaurantController.addMemberReview);

export default router;