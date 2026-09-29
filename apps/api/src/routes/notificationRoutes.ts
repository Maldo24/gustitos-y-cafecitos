import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticateActiveUser } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las notificaciones son privadas del usuario autenticado
router.use(authenticateActiveUser);

// GET /api/notifications - Listar mis notificaciones
router.get('/', notificationController.list);

// GET /api/notifications/unread-count - Cuántas tengo sin leer (campana)
router.get('/unread-count', notificationController.unreadCount);

// PATCH /api/notifications/:id/read - Marcar una como leída
router.patch('/:id/read', notificationController.markAsRead);

// POST /api/notifications/read-all - Marcar todas como leídas
router.post('/read-all', notificationController.markAllAsRead);

export default router;
