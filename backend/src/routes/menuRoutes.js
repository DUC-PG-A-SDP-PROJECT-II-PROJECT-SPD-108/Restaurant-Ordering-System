import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemStock,
  deleteMenuItem
} from '../controllers/menuController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Categories routes
router.get('/categories', getCategories);
router.post('/categories', verifyToken, requireRole('admin', 'manager'), createCategory);
router.put('/categories/:id', verifyToken, requireRole('admin', 'manager'), updateCategory);
router.delete('/categories/:id', verifyToken, requireRole('admin'), deleteCategory);

// Menu items routes
router.get('/menu', getMenuItems);
router.get('/menu/:id', getMenuItemById);
router.post('/menu', verifyToken, requireRole('admin', 'manager'), createMenuItem);
router.put('/menu/:id', verifyToken, requireRole('admin', 'manager'), updateMenuItem);
router.patch('/menu/:id/toggle', verifyToken, requireRole('admin', 'manager', 'staff', 'kitchen'), toggleMenuItemStock);
router.delete('/menu/:id', verifyToken, requireRole('admin'), deleteMenuItem);

export default router;
