// src/app.js
import 'dotenv/config';
import express from 'express';
import whatsappRoutes from './routes/whatsapp.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();
app.use(express.json());

app.use('/webhook/whatsapp', webhookRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Ruta raíz
app.get('/', (res) => {
  res.send('API Asistente CROV funcionando correctamente');
});

app.listen(process.env.PORT, () => {
  console.log(`API corriendo en puerto http://localhost:${process.env.PORT}`);
});

