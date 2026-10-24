const fs = require('fs');
const path = require('path');

/**
 * File-based JSON Database Adapter
 * This allows the backend to work immediately without requiring
 * external database software (like MongoDB or MySQL) to be installed first.
 * When you want to switch to MongoDB or MySQL, you can easily plug in the connection here.
 */

const getFilePath = (fileName) => path.join(__dirname, '..', 'data', fileName);

const readData = (fileName) => {
  try {
    const file = getFilePath(fileName);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err.message);
    return [];
  }
};

const writeData = (fileName, data) => {
  try {
    const file = getFilePath(fileName);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${fileName}:`, err.message);
    return false;
  }
};

module.exports = {
  readData,
  writeData
};
