import { Router } from 'express';
import { generateKhqr, checkPayment, settlePayment } from '../controllers/bakongController.js';

const router = Router();

// Bakong KHQR generate
router.post('/generate', generateKhqr);

// Bakong check payment by MD5
router.get('/check/:md5', checkPayment);

// Bakong payment settlement / webhook
router.post('/settle', settlePayment);
router.post('/webhook', settlePayment);

export default router;
