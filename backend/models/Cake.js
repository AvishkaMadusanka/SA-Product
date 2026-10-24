/**
 * Cake Data Model Schema Definition
 * Can be used as a plain schema validator or plugged into Mongoose / Sequelize.
 */

const CakeSchema = {
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['birthday', 'wedding', 'cupcakes', 'custom', 'structured', 'healthy'],
    required: true
  },
  price: { type: Number, default: 0 },
  image: { type: String, required: true },
  description: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
};

module.exports = CakeSchema;
