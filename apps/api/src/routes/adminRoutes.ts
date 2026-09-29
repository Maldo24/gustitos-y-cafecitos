import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateActiveUser, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de admin requieren token + rol admin
router.use(authenticateActiveUser, requireAdmin);

// GET /api/admin/stats - Estadisticas generales
router.get('/stats', adminController.getStats);

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', adminController.listUsers);

// PATCH /api/admin/users/:id/role - Cambiar rol de usuario
router.patch('/users/:id/role', adminController.updateUserRole);

// GET /api/admin/groups - Listar todos los grupos
router.get('/groups', adminController.listGroups);

// GET /api/admin/password-requests - Solicitudes de cambio de contraseña
router.get('/password-requests', adminController.listPasswordRequests);

// PATCH /api/admin/password-requests/:id - Aprobar o rechazar una solicitud
router.patch('/password-requests/:id', adminController.reviewPasswordRequest);

// DELETE /api/admin/groups/:id - Eliminar un grupo (exige justificación)
router.delete('/groups/:id', adminController.deleteGroup);

// POST /api/admin/groups/:id/restore - Restaurar un grupo eliminado
router.post('/groups/:id/restore', adminController.restoreGroup);

// PATCH /api/admin/users/:id/block - Bloquear o desbloquear una cuenta
router.patch('/users/:id/block', adminController.setUserBlocked);

// GET /api/admin/appeals - Listar apelaciones
router.get('/appeals', adminController.listAppeals);

// PATCH /api/admin/appeals/:id - Resolver una apelación
router.patch('/appeals/:id', adminController.resolveAppeal);

export default router;