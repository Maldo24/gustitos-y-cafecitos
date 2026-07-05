import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 1. Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// 2. Función para conectar a MongoDB Atlas
const connectDB = async () => {
  if (!MONGO_URI) {
    console.error('❌ ERROR: La variable MONGO_URI no está definida en el .env');
    process.exit(1);
  }

  try {
    console.log('⏳ Intentando conectar a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('🚀 ¡CONEXIÓN EXITOSA! Tu backend ya habla con MongoDB Atlas.');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

// 3. Ruta de prueba básica HTTP
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// 4. Arrancar el servidor e iniciar la conexión
app.listen(PORT, async () => {
  console.log(`💻 Servidor HTTP corriendo en http://localhost:${PORT}`);
  await connectDB();
});