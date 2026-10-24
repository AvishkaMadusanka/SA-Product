const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateOrder, validateOrderStatus } = require('../middleware/validator');
const { orderLimiter } = require('../middleware/rateLimiter');

// /api/orders

// Customer order placement (Rate limited & Validated against spam/XSS)
router.post('/', orderLimiter, validateOrder, createOrder);

// Protected order management endpoints (RBAC)
router.get('/', authenticate, requireRole('admin', 'staff'), getAllOrders);
router.get('/:id', authenticate, requireRole('admin', 'staff'), getOrderById);
router.put('/:id/status', authenticate, requireRole('admin', 'staff'), validateOrderStatus, updateOrderStatus);
router.delete('/:id', authenticate, requireRole('admin'), deleteOrder);

module.exports = router;
