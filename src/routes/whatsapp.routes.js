// src/routes/whatsapp.routes.js
import { Router } from 'express';
import { sendTestMessage } from '../controllers/whatsapp.controller.js';

const router = Router();

router.post('/send', sendTestMessage);

export default router;
