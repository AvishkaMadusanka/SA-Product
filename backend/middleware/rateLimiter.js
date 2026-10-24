const { rateLimit } = require('express-rate-limit');
const logger = require('../utils/logger');

const isTest = process.env.NODE_ENV === 'test';

// General API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 200, // 200 requests per IP per window in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    logger.securityAudit({
      event: 'RATE_LIMIT_GLOBAL_EXCEEDED',
      ip: req.ip,
      status: 'BLOCKED',
      details: { path: req.originalUrl, method: req.method }
    });
    res.status(429).json(options.message);
  }
});

// Strict Authentication Rate Limiter (Login & Registration)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 5, // Max 5 login/register attempts per window per IP in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login/registration attempts from this IP. Please wait 15 minutes before trying again.'
  },
  handler: (req, res, next, options) => {
    logger.securityAudit({
      event: 'RATE_LIMIT_AUTH_EXCEEDED',
      ip: req.ip,
      status: 'BLOCKED',
      details: { path: req.originalUrl, method: req.method, email: req.body && req.body.email }
    });
    res.status(429).json(options.message);
  }
});

// Order Placement Rate Limiter (prevents automated order spam)
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 10, // Max 10 orders per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Order submission limit reached. Please wait a few minutes before placing more orders.'
  },
  handler: (req, res, next, options) => {
    logger.securityAudit({
      event: 'RATE_LIMIT_ORDER_EXCEEDED',
      ip: req.ip,
      status: 'BLOCKED',
      details: { path: req.originalUrl }
    });
    res.status(429).json(options.message);
  }
});

// Feedback Submission Rate Limiter
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Feedback submission limit reached. Please try again later.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  orderLimiter,
  feedbackLimiter
};
