import { Router } from 'express';
import {
  verifyWebhook,
  receiveMessage
} from '../controllers/webhook.controller.js';

const router = Router();

router.get('/', verifyWebhook);

router.post('/', receiveMessage);

export default router;
