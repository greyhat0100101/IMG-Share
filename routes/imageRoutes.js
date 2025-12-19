const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const ctrl = require('../controllers/imageController');

// Obtener imágenes por álbum
router.get('/album/:albumId', ctrl.getImagesByAlbum);

// Subir imagen
router.post('/', upload.single('image'), ctrl.uploadImage);

// ⚠️ BORRAR IMAGEN (ESTA RUTA ES CLAVE)
router.delete('/:id', ctrl.deleteImage);

module.exports = router;
