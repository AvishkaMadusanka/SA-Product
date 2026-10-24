const { readData, writeData } = require('../config/db');

const ORDERS_FILE = 'orders.json';

// Get all orders (Admin)
const getAllOrders = (req, res) => {
  try {
    let orders = readData(ORDERS_FILE);
    const { status, category } = req.query;

    if (status) {
      orders = orders.filter(o => o.status && o.status.toLowerCase() === status.toLowerCase());
    }
    if (category) {
      orders = orders.filter(o => o.category && o.category.toLowerCase() === category.toLowerCase());
    }

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving orders', error: error.message });
  }
};

// Get single order
const getOrderById = (req, res) => {
  try {
    const orders = readData(ORDERS_FILE);
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create new customer order (User Side)
const createOrder = (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      category,
      flavor,
      weightKg,
      quantity,
      deliveryDate,
      deliveryAddress,
      specialNotes,
      photo
    } = req.body;

    if (!customerName || !phone || !category) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone number, and cake category are required.'
      });
    }

    const orders = readData(ORDERS_FILE);
    const newOrder = {
      id: 'ord-' + Date.now(),
      customerName,
      phone,
      email: email || '',
      category,
      flavor: flavor || 'Standard',
      weightKg: weightKg ? Number(weightKg) : null,
      quantity: quantity ? Number(quantity) : 1,
      deliveryDate: deliveryDate || '',
      deliveryAddress: deliveryAddress || '',
      specialNotes: specialNotes || '',
      photo: photo || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder); // Add to beginning of list
    writeData(ORDERS_FILE, orders);

    res.status(201).json({
      success: true,
      message: 'Cake order placed successfully!',
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
};

// Update order status (Admin)
const updateOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    const orders = readData(ORDERS_FILE);
    const index = orders.findIndex(o => o.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    orders[index].status = status || orders[index].status;
    orders[index].updatedAt = new Date().toISOString();
    writeData(ORDERS_FILE, orders);

    res.json({ success: true, message: 'Order status updated', data: orders[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
};

// Delete order (Admin)
const deleteOrder = (req, res) => {
  try {
    const orders = readData(ORDERS_FILE);
    const filtered = orders.filter(o => o.id !== req.params.id);

    if (orders.length === filtered.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    writeData(ORDERS_FILE, filtered);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
