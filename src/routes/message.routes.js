import { Router } from 'express';
import { sendTestMessage } from '../controllers/message.controller.js';

const router = Router();

router.post('/send', sendTestMessage);

export default router;
