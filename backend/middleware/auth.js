const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    logger.warn('JWT_SECRET is unset or too short. Using fallback for non-production environments.');
    return secret || 'insecure_development_jwt_secret_fallback_key_32chars';
  }
  return secret;
};

const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  cookieHeader.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  });
  return cookies;
};

/**
 * Authentication Middleware
 * Extracts and verifies JWT from Authorization header, X-Auth-Token, or cookie.
 * Enforces CSRF token check if authentication relies on ambient browser cookies.
 */
const authenticate = (req, res, next) => {
  let token = null;
  let isCookieAuth = false;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  } else {
    const cookies = req.cookies || parseCookies(req.headers.cookie);
    if (cookies && (cookies.authToken || cookies['auth-token'] || cookies.token)) {
      token = cookies.authToken || cookies['auth-token'] || cookies.token;
      isCookieAuth = true;
    }
  }

  if (!token) {
    logger.securityAudit({
      event: 'UNAUTHENTICATED_ACCESS_ATTEMPT',
      ip: req.ip,
      status: 'DENIED',
      details: { path: req.originalUrl, method: req.method }
    });
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.'
    });
  }

  // Enforce CSRF protection on state-changing requests if authenticated via cookie
  if (isCookieAuth && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase())) {
    const cookies = req.cookies || parseCookies(req.headers.cookie);
    const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    const csrfCookie = cookies['csrf-token'] || cookies['XSRF-TOKEN'] || cookies.csrfToken;

    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      logger.securityAudit({
        event: 'CSRF_VALIDATION_FAILURE',
        ip: req.ip,
        status: 'DENIED',
        details: { path: req.originalUrl, method: req.method }
      });
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token for cookie-authenticated request.'
      });
    }
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    logger.securityAudit({
      event: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      ip: req.ip,
      status: 'DENIED',
      details: { path: req.originalUrl, method: req.method, error: err.message }
    });
    return res.status(401).json({
      success: false,
      message: isExpired ? 'Token has expired. Please log in again.' : 'Invalid authentication token.'
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to specified roles (e.g. 'admin', 'staff', 'customer').
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.securityAudit({
        event: 'FORBIDDEN_ROLE_ACCESS',
        ip: req.ip,
        userId: req.user.id,
        status: 'FORBIDDEN',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
          method: req.method
        }
      });
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to perform this action.'
      });
    }

    next();
  };
};

/**
 * Optional Authentication (attaches req.user if token is present, does not fail if absent)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      req.user = jwt.verify(token, getJwtSecret());
    } catch (e) {
      // Ignored for optional auth
    }
  }
  next();
};

module.exports = {
  authenticate,
  requireRole,
  optionalAuth,
  getJwtSecret
};
