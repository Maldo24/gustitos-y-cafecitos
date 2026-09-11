import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import categoryRoutes from './routes/categoryRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { categoryService } from './services/categoryService.js';
import { User } from './models/User.js';
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware de configuracion basica
app.use(cors());
app.use(express.json());

// Inicializacion de las rutas de la aplicacion
app.use('/api/categories', categoryRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sessions', sessionRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
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
 * Siembra datos iniciales (categorias pre-hechas y usuario admin)
 */
const seedInitialData = async (): Promise<void> => {
  try {
    // Categorias pre-definidas
    await categoryService.seedDefaultCategories();
    console.log('Default categories seeded.');

    // Usuario admin desde variables de entorno
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminUsername && adminPassword) {
      const cleanAdminUsername = adminUsername.replace(/\s+/g, "").trim();
      const existingAdmin = await User.findOne({ username: cleanAdminUsername });
      if (!existingAdmin) {
        const adminHash = await bcrypt.hash(adminPassword, 10);
        await User.create({
          username: cleanAdminUsername,
          passwordHash: adminHash,
          names: process.env.ADMIN_NAMES || 'Administrador',
          firstSurname: 'Sistema',
          email: adminEmail || `${cleanAdminUsername}@gustitos-admin.local`,
          role: 'admin'
        });
        console.log(`Admin user '${cleanAdminUsername}' created.`);
      } else {
        console.log(`Admin user '${cleanAdminUsername}' already exists.`);
      }
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

/**
 * Arranca la aplicacion Express
 */
const startServer = async (): Promise<void> => {
  await initializeDatabase();
  await seedInitialData();

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