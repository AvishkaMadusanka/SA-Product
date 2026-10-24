const {
  escapeHtml,
  cleanString,
  isValidEmail,
  isValidPhone,
  isStrongPassword
} = require('../utils/sanitize');
const logger = require('../utils/logger');

const ALLOWED_CATEGORIES = ['birthday', 'wedding', 'cupcakes', 'custom', 'structured', 'healthy'];
const ALLOWED_ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'];

const badRequest = (res, message) => {
  return res.status(400).json({ success: false, message });
};

// Validate user registration input
const validateRegister = (req, res, next) => {
  const { email, password, name, role } = req.body || {};

  const cleanEmail = cleanString(email);
  const cleanName = cleanString(name);

  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return badRequest(res, 'A valid email address is required.');
  }

  if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
    return badRequest(res, 'Name must be between 2 and 60 characters.');
  }

  if (!isStrongPassword(password)) {
    return badRequest(res, 'Password must be at least 8 characters long and contain both letters and numbers.');
  }

  if (role && !['admin', 'staff', 'customer'].includes(role)) {
    return badRequest(res, 'Invalid role specified.');
  }

  req.body.email = cleanEmail.toLowerCase();
  req.body.name = escapeHtml(cleanName);
  next();
};

// Validate user login input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  const cleanEmail = cleanString(email);
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return badRequest(res, 'Valid email is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return badRequest(res, 'Password is required.');
  }

  req.body.email = cleanEmail.toLowerCase();
  next();
};

// Validate cake creation/update input
const validateCake = (req, res, next) => {
  const { title, category, price, image, description, featured } = req.body || {};

  const cleanTitle = cleanString(title);
  const cleanCat = cleanString(category).toLowerCase();
  const cleanDesc = cleanString(description);
  const numPrice = Number(price);

  if (!cleanTitle || cleanTitle.length < 2 || cleanTitle.length > 100) {
    return badRequest(res, 'Cake title must be between 2 and 100 characters.');
  }

  if (!ALLOWED_CATEGORIES.includes(cleanCat)) {
    return badRequest(res, `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
  }

  if (isNaN(numPrice) || numPrice < 0 || numPrice > 1000000) {
    return badRequest(res, 'Price must be a valid positive number under 1,000,000.');
  }

  if (cleanDesc && cleanDesc.length > 1000) {
    return badRequest(res, 'Description must not exceed 1000 characters.');
  }

  // Safe image path/url validation
  let cleanImage = cleanString(image);
  if (cleanImage) {
    // Only allow relative assets paths or https urls or safe base64
    const isRelativePath = /^assets\/images\/[\w\-\.\/ ]+$/i.test(cleanImage);
    const isHttpsUrl = /^https:\/\/[\w\-\.\/?#=&%]+$/i.test(cleanImage);
    const isDataImage = /^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/i.test(cleanImage);
    if (!isRelativePath && !isHttpsUrl && !isDataImage) {
      return badRequest(res, 'Invalid image source format.');
    }
  }

  req.body.title = escapeHtml(cleanTitle);
  req.body.category = cleanCat;
  req.body.price = numPrice;
  req.body.description = escapeHtml(cleanDesc);
  req.body.image = cleanImage || 'assets/images/site/bg photo.jpg';
  req.body.featured = Boolean(featured);

  next();
};

// Validate customer order input
const validateOrder = (req, res, next) => {
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
  } = req.body || {};

  const cleanName = cleanString(customerName);
  const cleanPh = cleanString(phone);
  const cleanMail = cleanString(email);
  const cleanCat = cleanString(category);
  const cleanAddr = cleanString(deliveryAddress);
  const cleanNotes = cleanString(specialNotes);
  const cleanFlavor = cleanString(flavor);

  if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
    return badRequest(res, 'Customer name must be between 2 and 60 characters.');
  }

  if (!cleanPh || !isValidPhone(cleanPh)) {
    return badRequest(res, 'Please provide a valid phone number (e.g. 0719323620 or +94719323620).');
  }

  if (cleanMail && !isValidEmail(cleanMail)) {
    return badRequest(res, 'Please provide a valid email address.');
  }

  if (!cleanCat || cleanCat.length > 50) {
    return badRequest(res, 'Valid cake category is required.');
  }

  if (cleanAddr && cleanAddr.length > 250) {
    return badRequest(res, 'Delivery address cannot exceed 250 characters.');
  }

  if (cleanNotes && cleanNotes.length > 1000) {
    return badRequest(res, 'Special notes cannot exceed 1000 characters.');
  }

  req.body.customerName = escapeHtml(cleanName);
  req.body.phone = cleanPh;
  req.body.email = cleanMail ? cleanMail.toLowerCase() : '';
  req.body.category = escapeHtml(cleanCat);
  req.body.flavor = escapeHtml(cleanFlavor || 'Standard');
  req.body.deliveryAddress = escapeHtml(cleanAddr);
  req.body.specialNotes = escapeHtml(cleanNotes);
  req.body.weightKg = weightKg ? Number(weightKg) : null;
  req.body.quantity = quantity ? Math.max(1, parseInt(quantity, 10)) : 1;
  req.body.deliveryDate = cleanString(deliveryDate);

  next();
};

// Validate order status update
const validateOrderStatus = (req, res, next) => {
  const { status } = req.body || {};
  if (!status || !ALLOWED_ORDER_STATUSES.includes(status)) {
    return badRequest(res, `Status must be one of: ${ALLOWED_ORDER_STATUSES.join(', ')}.`);
  }
  next();
};

// Validate customer feedback review
const validateFeedback = (req, res, next) => {
  const { name, rating, message, image } = req.body || {};

  const cleanName = cleanString(name);
  const cleanMsg = cleanString(message);
  const numRating = Number(rating);

  if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
    return badRequest(res, 'Name must be between 2 and 60 characters.');
  }

  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return badRequest(res, 'Rating must be an integer between 1 and 5.');
  }

  if (!cleanMsg || cleanMsg.length < 5 || cleanMsg.length > 1000) {
    return badRequest(res, 'Feedback message must be between 5 and 1000 characters.');
  }

  req.body.name = escapeHtml(cleanName);
  req.body.rating = Math.round(numRating);
  req.body.message = escapeHtml(cleanMsg);

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCake,
  validateOrder,
  validateOrderStatus,
  validateFeedback
};
