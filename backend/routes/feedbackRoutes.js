const express = require('express');
const router = express.Router();
const {
  getAllFeedback,
  createFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateFeedback } = require('../middleware/validator');
const { feedbackLimiter } = require('../middleware/rateLimiter');

// /api/feedback

// Public read
router.get('/', getAllFeedback);

// Public submission (rate-limited and sanitized against stored XSS)
router.post('/', feedbackLimiter, validateFeedback, createFeedback);

// Protected deletion (admin only)
router.delete('/:id', authenticate, requireRole('admin'), deleteFeedback);

module.exports = router;
