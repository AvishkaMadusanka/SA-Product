/**
 * Feedback Data Model Schema Definition
 */

const FeedbackSchema = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  message: { type: String, required: true },
  image: { type: String, default: 'assets/images/site/bg photo.jpg' },
  createdAt: { type: Date, default: Date.now }
};

module.exports = FeedbackSchema;
