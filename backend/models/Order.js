/**
 * Order Data Model Schema Definition
 */

const OrderSchema = {
  id: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  category: { type: String, required: true },
  flavor: { type: String, default: 'Standard' },
  weightKg: { type: Number, default: 1 },
  quantity: { type: Number, default: 1 },
  deliveryDate: { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },
  specialNotes: { type: String, default: '' },
  photo: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  totalPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

module.exports = OrderSchema;
