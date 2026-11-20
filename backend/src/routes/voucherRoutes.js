import { Router } from 'express';
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher
} from '../controllers/voucherController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Public: Fetch vouchers (used by Customer Banner & Checkout)
router.get('/', getVouchers);

// Protected: Admin only CRUD
router.post('/', verifyToken, requireRole('admin', 'manager'), createVoucher);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), updateVoucher);
router.delete('/:id', verifyToken, requireRole('admin'), deleteVoucher);

export default router;
