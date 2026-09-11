import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_para_desarrollo';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. No se proporciono un token.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Si jwt.verify devuelve un string (raro, pero posible según firma), tiramos error
    if (typeof decoded === 'string') {
      res.status(403).json({ error: 'Token invalido.' });
      return;
    }

    (req as any).user = decoded; 
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalido o expirado.' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos de administrador.' });
  }
};