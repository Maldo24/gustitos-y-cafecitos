import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { passwordRequestController } from '../controllers/passwordRequestController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoints públicos (no requieren token)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Recuperación de contraseña con aprobación del admin (público: el usuario no puede iniciar sesión)
router.post('/password-requests', passwordRequestController.create);
router.post('/password-requests/status', passwordRequestController.status);
router.post('/password-requests/confirm', passwordRequestController.confirm);

// Endpoint privado (requiere token válido)
router.get('/me', authenticateToken, authController.getMe);

export default router;