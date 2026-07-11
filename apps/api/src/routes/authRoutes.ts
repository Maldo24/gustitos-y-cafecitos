import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoints públicos (no requieren token)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Endpoint privado (requiere token válido)
router.get('/me', authenticateToken, authController.getMe);

export default router;