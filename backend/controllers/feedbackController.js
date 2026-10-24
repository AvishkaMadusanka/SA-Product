const { readData, writeData } = require('../config/db');

const FEEDBACK_FILE = 'feedback.json';

// Get all feedback reviews
const getAllFeedback = (req, res) => {
  try {
    const feedback = readData(FEEDBACK_FILE);
    res.json({ success: true, count: feedback.length, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving feedback', error: error.message });
  }
};

// Create customer feedback review
const createFeedback = (req, res) => {
  try {
    const { name, rating, message, image } = req.body;

    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Name and feedback message are required' });
    }

    const feedback = readData(FEEDBACK_FILE);
    const newFeedback = {
      id: 'fb-' + Date.now(),
      name,
      rating: Number(rating) || 5,
      message,
      image: image || 'assets/images/site/bg photo.jpg',
      createdAt: new Date().toISOString()
    };

    feedback.unshift(newFeedback);
    writeData(FEEDBACK_FILE, feedback);

    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: newFeedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback', error: error.message });
  }
};

// Delete feedback (Admin)
const deleteFeedback = (req, res) => {
  try {
    const feedback = readData(FEEDBACK_FILE);
    const filtered = feedback.filter(f => f.id !== req.params.id);

    if (feedback.length === filtered.length) {
      return res.status(404).json({ success: false, message: 'Feedback item not found' });
    }

    writeData(FEEDBACK_FILE, filtered);
    res.json({ success: true, message: 'Feedback removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete feedback', error: error.message });
  }
};

module.exports = {
  getAllFeedback,
  createFeedback,
  deleteFeedback
};
