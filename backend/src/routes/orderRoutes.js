import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = Router();

// Create new order (Public: used by customer checkout)
router.post('/', createOrder);

// Get orders list (Used by KDS & Admin)
router.get('/', getOrders);

// Get order details by ID (Used by Live Order Tracker)
router.get('/:id', getOrderById);

// Update order status (Used by KDS & Staff)
router.patch('/:id/status', updateOrderStatus);

export default router;
