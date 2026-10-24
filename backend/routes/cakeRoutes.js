const express = require('express');
const router = express.Router();
const {
  getAllCakes,
  getCakeById,
  createCake,
  deleteCake
} = require('../controllers/cakeController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateCake } = require('../middleware/validator');

// /api/cakes

// Public endpoints
router.get('/', getAllCakes);
router.get('/:id', getCakeById);

// Protected endpoints (RBAC)
// Creating cakes requires admin or staff role + strict input validation
router.post('/', authenticate, requireRole('admin', 'staff'), validateCake, createCake);

// Deleting cakes requires admin role
router.delete('/:id', authenticate, requireRole('admin'), deleteCake);

module.exports = router;
