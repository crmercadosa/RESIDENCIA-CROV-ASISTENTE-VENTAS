// src/app.js
import 'dotenv/config';
import express from 'express';
import whatsappRoutes from './routes/message.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { pool } from './config/mysql.js';

const app = express();
app.use(express.json());

// endpoint principal
app.use('/webhook/whatsapp', webhookRoutes);

// endpoint para el mensaje de prueba
app.use('/api/whatsapp', whatsappRoutes);

// ruta predeterminada
app.get('/', (req, res) => {
  res.send('API Asistente CROV funcionando correctamente');
});

// Conexion a la base de datos
try {
  const connection = await pool.getConnection();
  console.log('Conexión exitosa a MySQL');
  connection.release();
} catch (error) {
  console.error('Error al conectar a MySQL:', error.message);
}


app.listen(process.env.PORT, () => {
  console.log(`API corriendo en puerto http://localhost:${process.env.PORT}`);
});

