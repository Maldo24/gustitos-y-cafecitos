import { Router } from 'express';
import { appealController } from '../controllers/appealController.js';
import { authenticateTokenAllowBlocked } from '../middlewares/authMiddleware.js';

const router = Router();

// Acepta tokens de cuentas bloqueadas: justamente quien apela es el bloqueado.
// El token es opcional en POST / para el caso "me bloquearon y ni puedo entrar".
router.post('/', appealController.create);
router.get('/mine', authenticateTokenAllowBlocked, appealController.listMine);

export default router;
