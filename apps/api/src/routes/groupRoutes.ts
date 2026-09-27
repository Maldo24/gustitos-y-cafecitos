import { Router } from 'express';
import { groupController } from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/groups - Crear un grupo vacio (o con un creador)
router.post('/',authenticateToken, groupController.create);

// GET /api/groups/my-groups - Obtener los grupos del usuario logueado
router.get('/my-groups', authenticateToken, groupController.getMyGroups);

// GET /api/groups/:slug - Obtener el grupo completo por su URL unica
router.get('/:slug', groupController.getBySlug);

// POST /api/groups/:slug/restaurants - Añadir un restaurante sugerido al grupo
router.post('/:slug/restaurants', groupController.suggestRestaurant);

// POST /api/groups/:groupId/members - Agregar un amigo al grupo por username
router.post('/:groupId/members', groupController.addMember);

// DELETE /api/groups/:groupId/members/:memberId - Expulsar a un miembro (solo admin del grupo)
router.delete('/:groupId/members/:memberId', authenticateToken, groupController.removeMember);

// DELETE /api/groups/:groupId/restaurants/:restaurantId - Eliminar recomendación (solo admin del grupo)
router.delete('/:groupId/restaurants/:restaurantId', authenticateToken, groupController.removeRestaurant);

// POST /api/groups/:groupId/join - Unirse al grupo con el usuario autenticado
router.post('/:groupId/join', authenticateToken, groupController.join);

// GET /api/groups/:groupId/members - Obtener la lista de miembros de un grupo
router.get('/:groupId/members', groupController.getMembers);

export default router;