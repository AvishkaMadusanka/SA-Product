/**
 * User Model Schema Definition
 * Supports Role-Based Access Control (RBAC): admin, staff, customer
 */

const UserSchema = {
  id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer'
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
};

module.exports = UserSchema;
