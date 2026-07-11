import { Router } from 'express';
import { userController } from '../controllers/userController.js';

const router = Router();

// Ruta para registrar un usuario: POST /api/users/register
router.post('/register', userController.register);

export default router;