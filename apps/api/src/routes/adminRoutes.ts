import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de admin requieren token + rol admin
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Estadisticas generales
router.get('/stats', adminController.getStats);

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', adminController.listUsers);

// PATCH /api/admin/users/:id/role - Cambiar rol de usuario
router.patch('/users/:id/role', adminController.updateUserRole);

// GET /api/admin/groups - Listar todos los grupos
router.get('/groups', adminController.listGroups);

export default router;