/**
 * CLI Utility to securely create an Admin or Staff account
 * Usage: node scripts/createAdmin.js <email> <password> <name> [role=admin]
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const { readData, writeData } = require('../config/db');
const { isValidEmail, isStrongPassword, cleanString, escapeHtml } = require('../utils/sanitize');

const args = process.argv.slice(2);
const [rawEmail, rawPassword, rawName, rawRole = 'admin'] = args;

if (!rawEmail || !rawPassword || !rawName) {
  console.log('---------------------------------------------------------');
  console.log('🍰 SA Product - Secure Admin Account Creator');
  console.log('---------------------------------------------------------');
  console.log('Usage: node scripts/createAdmin.js <email> <password> <name> [role]');
  console.log('Example: node scripts/createAdmin.js admin@saproduct.lk MySecretP@ss123 "Admin User" admin');
  console.log('Allowed roles: admin, staff');
  console.log('---------------------------------------------------------');
  process.exit(1);
}

const email = cleanString(rawEmail).toLowerCase();
const name = escapeHtml(cleanString(rawName));
const role = ['admin', 'staff'].includes(rawRole.toLowerCase()) ? rawRole.toLowerCase() : 'admin';

if (!isValidEmail(email)) {
  console.error('❌ Error: Invalid email format.');
  process.exit(1);
}

if (!isStrongPassword(rawPassword)) {
  console.error('❌ Error: Password must be at least 8 characters and include both letters and numbers.');
  process.exit(1);
}

async function run() {
  const users = readData('users.json');
  const existing = users.find(u => u.email === email);

  if (existing) {
    console.error(`❌ Error: User with email "${email}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const newUser = {
    id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    email,
    name,
    role,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData('users.json', users);

  console.log('✅ Success! Account created securely.');
  console.log(`👤 Name: ${name}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🛡️ Role: ${role}`);
  console.log('🔑 Password: [PROTECTED & HASHED WITH BCRYPT (12 rounds)]');
}

run().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
