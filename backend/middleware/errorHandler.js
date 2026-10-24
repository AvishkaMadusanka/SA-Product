const logger = require('../utils/logger');

// Centralized Safe Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  // Determine appropriate status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.statusCode && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Safe error logging (redacted)
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    statusCode,
    ip: req.ip,
    name: err.name
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Return clean, safe response to client
  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'An unexpected internal error occurred. Please contact support.' : (err.message || 'Internal Server Error'),
    stack: isProduction ? null : err.stack
  });
};

module.exports = {
  errorHandler
};
