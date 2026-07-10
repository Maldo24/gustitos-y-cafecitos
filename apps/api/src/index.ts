import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userRoutes from './routes/useRoutes';
import categoryRoutes from './routes/categoryRoutes'
import restaurantRoutes from './routes/restaurantRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js'
import authRoutes from "./routes/authRoutes.js"
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware de configuracion basica
app.use(cors());
app.use(express.json());

// Inicializacion de las rutas de la aplicacion
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/session', sessionRoutes)
app.use ('/api/auth', authRoutes)
// Verificacion de estado del servicio (Health Check)
app.get('/api/health', (req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: 'active',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

/**
 * Establece la conexion con la base de datos MongoDB Atlas
 */
const initializeDatabase = async (): Promise<void> => {
  if (!MONGO_URI) {
    console.error('Database connection failed: MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

/**
 * Arranca la aplicacion Express
 */
const startServer = async (): Promise<void> => {
  await initializeDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Manejo de apagado controlado (Graceful Shutdown)
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await mongoose.connection.close();
      console.log('Database connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();