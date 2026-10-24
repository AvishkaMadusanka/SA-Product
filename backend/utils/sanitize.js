/**
 * Sanitization and validation helper functions
 * Prevents XSS injection and cleans input data before storage.
 */

// HTML entity escaping for XSS prevention
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Strips dangerous control chars and null bytes
const cleanString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '').trim();
};

// Email validation regex (RFC 5322 compliant basic structure)
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
};

// Phone validation regex (accepts Sri Lanka 07XXXXXXXX, +94XXXXXXXXX, or standard international 8-15 digits)
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+?\d{8,15})$/;
  return phoneRegex.test(cleaned);
};

// Password strength check (at least 8 chars, 1 number, 1 letter)
const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

module.exports = {
  escapeHtml,
  cleanString,
  isValidEmail,
  isValidPhone,
  isStrongPassword
};
