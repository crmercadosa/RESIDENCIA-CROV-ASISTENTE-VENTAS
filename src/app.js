// src/app.js
import 'dotenv/config';
import express from 'express';
import whatsappRoutes from './routes/whatsapp.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();
app.use(express.json());

app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/webhook', webhookRoutes);

app.listen(process.env.PORT, () => {
  console.log('API corriendo en puerto', process.env.PORT);
});

