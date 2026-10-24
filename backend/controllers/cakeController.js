const { readData, writeData } = require('../config/db');

const CAKES_FILE = 'cakes.json';

// Get all cakes (with optional category filter)
const getAllCakes = (req, res) => {
  try {
    let cakes = readData(CAKES_FILE);
    const { category } = req.query;

    if (category) {
      cakes = cakes.filter(
        c => c.category && c.category.toLowerCase() === category.toLowerCase()
      );
    }

    res.json({ success: true, count: cakes.length, data: cakes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving cakes', error: error.message });
  }
};

// Get single cake by ID
const getCakeById = (req, res) => {
  try {
    const cakes = readData(CAKES_FILE);
    const cake = cakes.find(c => c.id === req.params.id);

    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }

    res.json({ success: true, data: cake });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create new cake (Admin)
const createCake = (req, res) => {
  try {
    const { title, category, price, image, description, featured } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    const cakes = readData(CAKES_FILE);
    const newCake = {
      id: 'cake-' + Date.now(),
      title,
      category,
      price: Number(price) || 0,
      image: image || 'assets/images/site/bg photo.jpg',
      description: description || '',
      featured: Boolean(featured),
      createdAt: new Date().toISOString()
    };

    cakes.push(newCake);
    writeData(CAKES_FILE, cakes);

    res.status(201).json({ success: true, message: 'Cake added successfully', data: newCake });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create cake', error: error.message });
  }
};

// Delete cake by ID (Admin)
const deleteCake = (req, res) => {
  try {
    const cakes = readData(CAKES_FILE);
    const filtered = cakes.filter(c => c.id !== req.params.id);

    if (cakes.length === filtered.length) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }

    writeData(CAKES_FILE, filtered);
    res.json({ success: true, message: 'Cake deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete cake', error: error.message });
  }
};

module.exports = {
  getAllCakes,
  getCakeById,
  createCake,
  deleteCake
};
