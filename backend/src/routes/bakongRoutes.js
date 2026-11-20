import { Router } from 'express';
import { generateKhqr, checkPayment } from '../controllers/bakongController.js';

const router = Router();

// Bakong KHQR generate
router.post('/generate', generateKhqr);

// Bakong check payment by MD5
router.get('/check/:md5', checkPayment);

export default router;
