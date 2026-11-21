import { Router } from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff
} from '../controllers/staffController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Staff roster management routes (Protected: Admin & Manager)
router.get('/', getStaff);
router.post('/', verifyToken, requireRole('admin', 'manager'), createStaff);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), updateStaff);
router.delete('/:id', verifyToken, requireRole('admin'), deleteStaff);

export default router;
