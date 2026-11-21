import { Router } from 'express';
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  verifyVoucher
} from '../controllers/voucherController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { createRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Rate limiter for promo verification: 40 requests/minute per IP
const voucherRateLimiter = createRateLimiter(40, 60000, 'Too many promo verification attempts. Please wait 1 minute.');

// Public: Fetch vouchers & Verify promo code
router.get('/', getVouchers);
router.post('/verify', voucherRateLimiter, verifyVoucher);

// Protected: Admin only CRUD
router.post('/', verifyToken, requireRole('admin', 'manager'), createVoucher);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), updateVoucher);
router.delete('/:id', verifyToken, requireRole('admin'), deleteVoucher);

export default router;
