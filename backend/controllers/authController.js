const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../config/db');
const { getJwtSecret } = require('../middleware/auth');
const logger = require('../utils/logger');

const USERS_FILE = 'users.json';
const SALT_ROUNDS = 12;

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, name, role, bootstrapToken } = req.body;
    const users = readData(USERS_FILE);

    // Check if user already exists
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      logger.securityAudit({
        event: 'REGISTRATION_DUPLICATE_ATTEMPT',
        ip: req.ip,
        status: 'REJECTED',
        details: { email }
      });
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Role assignment logic:
    // Only allow 'admin' or 'staff' role if bootstrapToken matches or if existing admin registers them
    let assignedRole = 'customer';
    const isFirstUser = users.length === 0;
    const validBootstrap = process.env.ADMIN_BOOTSTRAP_TOKEN &&
      bootstrapToken &&
      String(bootstrapToken) === String(process.env.ADMIN_BOOTSTRAP_TOKEN);

    const callerIsAdmin = req.user && req.user.role === 'admin';

    if (role === 'admin' || role === 'staff') {
      if (isFirstUser || validBootstrap || callerIsAdmin) {
        assignedRole = role;
      } else {
        logger.securityAudit({
          event: 'UNAUTHORIZED_PRIVILEGE_ESCALATION_ATTEMPT',
          ip: req.ip,
          status: 'DENIED',
          details: { requestedRole: role, email }
        });
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to assign administrative roles.'
        });
      }
    }

    // Hash password with strong salt rounds
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      email: email.toLowerCase(),
      name,
      role: assignedRole,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeData(USERS_FILE, users);

    logger.securityAudit({
      event: 'USER_REGISTERED',
      ip: req.ip,
      userId: newUser.id,
      status: 'SUCCESS',
      details: { role: assignedRole, email: newUser.email }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        token
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ success: false, message: 'Registration failed due to a server error.' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readData(USERS_FILE);

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Constant-time check or uniform error to prevent user enumeration
    if (!user) {
      logger.securityAudit({
        event: 'LOGIN_FAILURE',
        ip: req.ip,
        status: 'FAILED',
        details: { email, reason: 'User not found' }
      });
      // Perform fake compare to prevent timing attack
      await bcrypt.compare(password, '$2a$12$e80x6k96P6L5uY37O7zUte0v53C8wJq27hS5B1v3C9P9P9P9P9P9P');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.securityAudit({
        event: 'LOGIN_FAILURE',
        ip: req.ip,
        userId: user.id,
        status: 'FAILED',
        details: { email, reason: 'Invalid password' }
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update lastLogin
    user.lastLogin = new Date().toISOString();
    writeData(USERS_FILE, users);

    logger.securityAudit({
      event: 'LOGIN_SUCCESS',
      ip: req.ip,
      userId: user.id,
      status: 'SUCCESS',
      details: { role: user.role, email: user.email }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ success: false, message: 'Login failed due to a server error.' });
  }
};

// Get current profile
const getProfile = (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
};

module.exports = {
  register,
  login,
  getProfile
};
