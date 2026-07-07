import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';

const router = Router();

// POST /api/sessions - Crear y calcular una nueva cuenta compartida
router.post('/', sessionController.create);

// GET /api/sessions/group/:groupId - Obtener el historial de cuentas de un grupo
router.get('/group/:groupId', sessionController.listByGroup);

export default router;