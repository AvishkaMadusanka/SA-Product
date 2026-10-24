const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { authenticate, optionalAuth } = require('../middleware/auth');

const crypto = require('crypto');

// POST /api/auth/register (rate limited, validated, optionalAuth to allow existing admin to register other admins)
router.post('/register', authLimiter, optionalAuth, validateRegister, authController.register);

// POST /api/auth/login (strict rate limiter, validated)
router.post('/login', authLimiter, validateLogin, authController.login);

// GET /api/auth/me (authenticated user profile)
router.get('/me', authenticate, authController.getProfile);

// GET /api/auth/csrf-token (provides CSRF token and sets XSRF-TOKEN cookie for cookie-based clients)
router.get('/csrf-token', (req, res) => {
  const csrfToken = crypto.randomBytes(24).toString('hex');
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
  res.json({ success: true, csrfToken });
});

module.exports = router;

