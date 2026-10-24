const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_long_for_security';
process.env.ADMIN_BOOTSTRAP_TOKEN = 'test_bootstrap_secret_token_123';

const app = require('../server');
const { getJwtSecret } = require('../middleware/auth');
const logger = require('../utils/logger');
const { escapeHtml, sanitizeObject } = require('../utils/sanitize');

// Paths to data files
const dataDir = path.join(__dirname, '..', 'data');
const usersPath = path.join(dataDir, 'users.json');
const ordersPath = path.join(dataDir, 'orders.json');
const feedbackPath = path.join(dataDir, 'feedback.json');
const cakesPath = path.join(dataDir, 'cakes.json');

// File backup storage to guarantee clean restore
let originalUsers = '[]';
let originalOrders = '[]';
let originalFeedback = '[]';
let originalCakes = '[]';

describe('SA Product Website - Security Verification Suite', () => {
  before(() => {
    if (fs.existsSync(usersPath)) originalUsers = fs.readFileSync(usersPath, 'utf8');
    if (fs.existsSync(ordersPath)) originalOrders = fs.readFileSync(ordersPath, 'utf8');
    if (fs.existsSync(feedbackPath)) originalFeedback = fs.readFileSync(feedbackPath, 'utf8');
    if (fs.existsSync(cakesPath)) originalCakes = fs.readFileSync(cakesPath, 'utf8');

    // Initialize with fresh test state
    fs.writeFileSync(usersPath, '[]', 'utf8');
  });

  after(() => {
    // Restore original state
    fs.writeFileSync(usersPath, originalUsers, 'utf8');
    fs.writeFileSync(ordersPath, originalOrders, 'utf8');
    fs.writeFileSync(feedbackPath, originalFeedback, 'utf8');
    fs.writeFileSync(cakesPath, originalCakes, 'utf8');
  });

  // ==========================================
  // 1. Secure HTTP Headers & CSP
  // ==========================================
  describe('1. Secure HTTP Headers & Content Security Policy', () => {
    it('should include Helmet security headers including nosniff and CSP', async () => {
      const res = await request(app).get('/api/health');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.strictEqual(res.headers['x-frame-options'], 'SAMEORIGIN');
      assert.ok(res.headers['content-security-policy'], 'CSP header should be present');
      assert.match(res.headers['content-security-policy'], /default-src 'self'/);
      assert.match(res.headers['content-security-policy'], /cdnjs\.cloudflare\.com/);
    });
  });

  // ==========================================
  // 2. Authentication & Password Hashing
  // ==========================================
  describe('2. Authentication & Password Protection', () => {
    it('should reject registration with a weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weakuser@example.com',
          password: 'short',
          name: 'Weak User'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Password must be at least 8 characters/i);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Invalid Email User'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /valid email/i);
    });

    it('should hash passwords with bcrypt (cost factor >= 12) and not store plaintext', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'securecustomer@example.com',
          password: 'StrongPassword2026!',
          name: 'Secure Customer'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token, 'Should return a JWT token upon registration');

      // Verify stored data in users.json
      const storedUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const found = storedUsers.find(u => u.email === 'securecustomer@example.com');
      assert.ok(found, 'User must be saved in database');
      assert.strictEqual(found.password, undefined, 'Plaintext password must NEVER be stored');
      assert.ok(found.passwordHash, 'Password hash must be present');
      assert.match(found.passwordHash, /^\$2[aby]\$12\$/, 'Hash must use bcrypt cost factor 12');

      const isMatch = await bcrypt.compare('StrongPassword2026!', found.passwordHash);
      assert.strictEqual(isMatch, true, 'Stored bcrypt hash must verify correct password');
    });

    it('should reject login with wrong password and use uniform message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'securecustomer@example.com',
          password: 'WrongPassword999'
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Invalid email or password.');
    });

    it('should reject login for non-existent user with same message to prevent enumeration', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'AnyPassword123'
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Invalid email or password.');
    });

    it('should successfully log in with valid credentials and issue JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'securecustomer@example.com',
          password: 'StrongPassword2026!'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);

      const decoded = jwt.verify(res.body.data.token, getJwtSecret());
      assert.strictEqual(decoded.email, 'securecustomer@example.com');
      assert.strictEqual(decoded.role, 'customer');
    });
  });

  // ==========================================
  // 3. Role-Based Access Control (RBAC)
  // ==========================================
  describe('3. Role-Based Access Control (RBAC) on Backend', () => {
    let customerToken = '';
    let adminToken = '';

    before(async () => {
      // 1. Get customer token
      const custRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'securecustomer@example.com', password: 'StrongPassword2026!' });
      customerToken = custRes.body.data.token;

      // 2. Register real admin using bootstrap token
      const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'realadmin@example.com',
          password: 'AdminMaster2026!',
          name: 'Super Admin',
          role: 'admin',
          bootstrapToken: 'test_bootstrap_secret_token_123'
        });
      adminToken = adminRes.body.data.token;
    });

    it('should reject unauthorized privilege escalation if unauthorized user tries to register as admin', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hacker@example.com',
          password: 'HackerPassword123!',
          name: 'Hacker Attempt',
          role: 'admin'
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Insufficient permissions/i);
    });

    it('should deny unauthenticated requests to protected admin endpoint /api/stats', async () => {
      const res = await request(app).get('/api/stats');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('should deny customer access to protected admin endpoint /api/stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Access forbidden/i);
    });

    it('should allow admin access to protected admin endpoint /api/stats', async () => {
      const res = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.totalProducts !== undefined);
    });

    it('should restrict cake deletion to admin role only', async () => {
      // Customer attempt -> 403
      const custAttempt = await request(app)
        .delete('/api/cakes/cake-001')
        .set('Authorization', `Bearer ${customerToken}`);
      assert.strictEqual(custAttempt.status, 403);

      // Unauthenticated attempt -> 401
      const anonAttempt = await request(app).delete('/api/cakes/cake-001');
      assert.strictEqual(anonAttempt.status, 401);
    });
  });

  // ==========================================
  // 4. Server-Side Input Validation & XSS Defense
  // ==========================================
  describe('4. Server-Side Input Validation & XSS Escaping', () => {
    it('should sanitize and escape HTML tags in order form to prevent Stored XSS', async () => {
      const maliciousPayload = {
        customerName: '<script>alert("xss")</script>John',
        phone: '0719323620',
        email: 'john@example.com',
        category: 'birthday',
        flavor: '<b>Chocolate</b>',
        specialNotes: '<img src=x onerror=alert(1)> Urgent',
        quantity: 1
      };

      const res = await request(app)
        .post('/api/orders')
        .send(maliciousPayload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);

      // Verify that stored data has been escaped
      const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      const latestOrder = orders[0]; // orderController uses unshift() to place latest order first

      assert.strictEqual(latestOrder.customerName, '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;John');
      assert.strictEqual(latestOrder.flavor, '&lt;b&gt;Chocolate&lt;&#x2F;b&gt;');
      assert.strictEqual(latestOrder.specialNotes, '&lt;img src=x onerror=alert(1)&gt; Urgent');
      assert.ok(!latestOrder.customerName.includes('<script>'), 'Raw HTML script tags must never be stored');
    });

    it('should reject order submission with invalid phone number format', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          customerName: 'Valid Name',
          phone: 'abc-not-phone',
          category: 'birthday'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /valid phone number/i);
    });

    it('should reject feedback with invalid rating out of 1-5 range', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({
          name: 'Jane Doe',
          rating: 10,
          message: 'Loved the healthy cake so much!'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Rating must be an integer between 1 and 5/i);
    });

    it('should escape HTML tags in feedback message', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({
          name: 'Reviewer',
          rating: 5,
          message: 'Best cake ever <iframe src="javascript:alert(1)"></iframe>'
        });

      assert.strictEqual(res.status, 201);
      const feedbackList = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
      const latest = feedbackList[0]; // feedbackController uses unshift()
      assert.ok(!latest.message.includes('<iframe'));
      assert.ok(latest.message.includes('&lt;iframe'));
    });
  });

  // ==========================================
  // 5. CSRF Protection for Cookie-Based Authentication
  // ==========================================
  describe('5. CSRF Protection for Cookie-Based Requests', () => {
    let adminToken = '';

    before(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'realadmin@example.com', password: 'AdminMaster2026!' });
      adminToken = res.body.data.token;
    });

    it('should issue a CSRF token from /api/auth/csrf-token endpoint', async () => {
      const res = await request(app).get('/api/auth/csrf-token');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.csrfToken, 'CSRF token should be returned');
      assert.ok(res.headers['set-cookie'], 'Should set csrf-token cookie');
    });

    it('should block cookie-authenticated state-changing requests when CSRF token is missing', async () => {
      const res = await request(app)
        .post('/api/cakes')
        .set('Cookie', [`authToken=${adminToken}`])
        .send({
          title: 'CSRF Attack Cake',
          category: 'birthday',
          price: 2500
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /CSRF token/i);
    });

    it('should block cookie-authenticated requests when CSRF token mismatches cookie', async () => {
      const res = await request(app)
        .post('/api/cakes')
        .set('Cookie', [`authToken=${adminToken}`, 'csrf-token=actual-token-value'])
        .set('X-CSRF-Token', 'forged-token-value')
        .send({
          title: 'CSRF Attack Cake',
          category: 'birthday',
          price: 2500
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /CSRF token/i);
    });

    it('should allow cookie-authenticated requests when matching X-CSRF-Token is provided', async () => {
      const validCsrf = 'secure-random-csrf-token-12345';
      const res = await request(app)
        .post('/api/cakes')
        .set('Cookie', [`authToken=${adminToken}`, `csrf-token=${validCsrf}`])
        .set('X-CSRF-Token', validCsrf)
        .send({
          title: 'Secure Validated Cake',
          category: 'birthday',
          price: 3200,
          description: 'Created with verified CSRF protection'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
    });
  });

  // ==========================================
  // 6. Rate Limiting Enforcement
  // ==========================================
  describe('6. Rate Limiting Protection', () => {
    it('should enforce rate limits and respond with 429 Too Many Requests when threshold exceeded', async () => {
      const express = require('express');
      const { rateLimit } = require('express-rate-limit');
      const testApp = express();

      const testLimiter = rateLimit({
        windowMs: 60000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests' }
      });

      testApp.get('/limited', testLimiter, (req, res) => res.json({ ok: true }));

      // Request 1: OK
      const r1 = await request(testApp).get('/limited');
      assert.strictEqual(r1.status, 200);

      // Request 2: OK
      const r2 = await request(testApp).get('/limited');
      assert.strictEqual(r2.status, 200);

      // Request 3: Blocked by Rate Limiter
      const r3 = await request(testApp).get('/limited');
      assert.strictEqual(r3.status, 429);
      assert.strictEqual(r3.body.success, false);
      assert.strictEqual(r3.body.message, 'Too many requests');
    });
  });

  // ==========================================
  // 7. Safe Error Handling & Secrets Protection
  // ==========================================
  describe('7. Safe Error Handling & Secrets Protection', () => {
    it('should return safe standardized JSON without stack trace on undefined routes', async () => {
      const res = await request(app).get('/api/not-a-real-endpoint-at-all');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.stack, undefined, 'Stack trace must NEVER be exposed');
    });

    it('should sanitize sensitive keys from security audit logs', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
        authorization: 'Bearer secret_value',
        cookie: 'authToken=abc',
        normalField: 'bakery'
      };

      const sanitized = logger.sanitizeLogData(sensitiveData);
      assert.strictEqual(sanitized.password, '[REDACTED]');
      assert.strictEqual(sanitized.token, '[REDACTED]');
      assert.strictEqual(sanitized.authorization, '[REDACTED]');
      assert.strictEqual(sanitized.cookie, '[REDACTED]');
      assert.strictEqual(sanitized.email, 'user@example.com');
      assert.strictEqual(sanitized.normalField, 'bakery');
    });
  });
});
