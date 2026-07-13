import { Router } from 'express';
import { groupController } from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/groups - Crear un grupo vacio (o con un creador)
router.post('/',authenticateToken, groupController.create);

// GET /api/groups/:slug - Obtener el grupo completo por su URL unica
router.get('/:slug', groupController.getBySlug);

// POST /api/groups/:slug/restaurants - Añadir un restaurante sugerido al grupo
router.post('/:slug/restaurants', groupController.suggestRestaurant);

// POST /api/groups/:groupId/members
router.post('/:groupId/members', groupController.addMember);

// GET /api/groups/my-groups - Obtener los grupos del usuario logueado
router.get('/my-groups', groupController.getMyGroups);

// GET /api/groups/:groupId/members - Obtener la lista de miembros de un grupo
router.get('/:groupId/members', groupController.getMembers);

export default router;