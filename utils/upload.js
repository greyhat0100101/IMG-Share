const multer = require('multer');

// Guardamos en memoria para subir a Cloudinary (buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  }
});

module.exports = upload;
