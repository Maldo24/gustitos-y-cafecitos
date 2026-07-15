import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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