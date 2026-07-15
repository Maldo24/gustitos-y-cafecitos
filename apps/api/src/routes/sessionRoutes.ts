import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js'; // <-- IMPORTANTE

const router = Router();

// Protegemos todas las rutas de sesiones
router.use(authenticateToken);

// POST /api/sessions - Crear y calcular una nueva cuenta compartida
router.post('/', sessionController.create);

// GET /api/sessions/group/:groupId - Obtener el historial de cuentas de un grupo
router.get('/group/:groupId', sessionController.listByGroup);

// GET /api/sessions/:sessionId - Obtener el detalle de una cuenta específica
router.get('/:sessionId', sessionController.getById);

// PUT /api/sessions/:sessionId/participant/:participantId/pay - Alternar estado de pago
router.put('/:sessionId/participant/:participantId/pay', sessionController.togglePayment);

export default router;