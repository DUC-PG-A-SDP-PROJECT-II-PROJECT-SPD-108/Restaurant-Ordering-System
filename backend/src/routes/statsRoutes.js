import { Router } from 'express';
import { getSummary, getTables, verifyVoucher } from '../controllers/statsController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Stats summary (Protected for Admin & Manager)
router.get('/stats/summary', getSummary);

// Restaurant tables list
router.get('/tables', getTables);

// Voucher code verification (Public)
router.post('/vouchers/verify', verifyVoucher);

export default router;
