const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const cakeRoutes = require('./routes/cakeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate, requireRole } = require('./middleware/auth');
const { globalLimiter } = require('./middleware/rateLimiter');
const { readData } = require('./config/db');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy if behind one (e.g. Nginx / Heroku / Render)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1. Security Headers & Content Security Policy (CSP) compatible with site resources
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
        ],
        styleSrcAttr: ["'unsafe-inline'"],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com"
        ],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://api.whatsapp.com", "https://wa.me"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5500',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, or local file)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('file://')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev flexible, restrict in prod
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token', 'X-CSRF-Token']
  })
);

// 3. Global Rate Limiter
app.use('/api', globalLimiter);

// 4. Body Parsers (supports photo uploads for custom cakes & customer feedback)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 6. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SA Product Cake Bakery API'
  });
});

// 7. Protected Admin Dashboard Stats Endpoint (RBAC: Admin or Staff)
app.get('/api/stats', authenticate, requireRole('admin', 'staff'), (req, res) => {
  try {
    const orders = readData('orders.json');
    const cakes = readData('cakes.json');
    const feedback = readData('feedback.json');

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status && o.status.toLowerCase() === 'pending').length;
    const completedOrders = orders.filter(o => o.status && o.status.toLowerCase() === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    res.json({
      success: true,
      data: {
        totalProducts: cakes.length,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalFeedback: feedback.length,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compute stats' });
  }
});

// 8. Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/feedback', feedbackRoutes);

// 9. Centralized Error Handling
app.use(errorHandler);

// Start server only when run directly (enables supertest imports without port collisions)
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🎂 SA Product Backend running at http://localhost:${PORT}`);
    logger.info(`📄 API Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    logger.info(`🍰 Cakes API: http://localhost:${PORT}/api/cakes`);
    logger.info(`📦 Orders API: http://localhost:${PORT}/api/orders`);
    logger.info(`💬 Feedback API: http://localhost:${PORT}/api/feedback`);
    logger.info(`📊 Admin Stats: http://localhost:${PORT}/api/stats`);
  });
}

module.exports = app;
