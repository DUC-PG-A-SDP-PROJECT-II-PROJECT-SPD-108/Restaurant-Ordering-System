import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  streamOrders,
  getOrderReceipt
} from '../controllers/orderController.js';

const router = Router();

// Create new order (Public: used by customer checkout)
router.post('/', createOrder);

// Real-time Server-Sent Events (SSE) Stream for KDS & Floor Live Displays
router.get('/stream', streamOrders);

// Get orders list (Supports pagination ?page=1&limit=20, status filter, date filter)
router.get('/', getOrders);

// Get 80mm/58mm thermal printable receipt data
router.get('/:id/receipt', getOrderReceipt);

// Get order details by ID (Used by Live Order Tracker)
router.get('/:id', getOrderById);

// Update order status (Used by KDS & Staff)
router.patch('/:id/status', updateOrderStatus);

export default router;
