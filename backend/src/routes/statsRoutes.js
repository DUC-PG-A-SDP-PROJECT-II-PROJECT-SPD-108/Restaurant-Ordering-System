import { Router } from 'express';
import { getSummary, getTables, updateTable, verifyVoucher } from '../controllers/statsController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Stats summary (Protected for Admin & Manager)
router.get('/stats/summary', getSummary);

// Restaurant tables list & mutations
router.get('/tables', getTables);
router.patch('/tables/:id/status', updateTable);
router.put('/tables/:id', updateTable);

// Voucher code verification (Public)
router.post('/vouchers/verify', verifyVoucher);

export default router;
