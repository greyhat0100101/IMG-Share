const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const Image = require('../models/Image');
const Album = require('../models/Album');
const asyncHandler = require('../utils/asyncHandler');
const { assertMongoId } = require('../utils/validators');

/* ======================
   HELPERS
====================== */
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/* ======================
   GET IMAGES
====================== */
exports.getImagesByAlbum = asyncHandler(async (req, res) => {
  const { albumId } = req.params;
  assertMongoId(albumId, 'albumId');

  const images = await Image.find({ album: albumId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ ok: true, data: images });
});

/* ======================
   UPLOAD IMAGE
====================== */
exports.uploadImage = asyncHandler(async (req, res) => {
  const { albumId, organizationId } = req.body;
  assertMongoId(albumId, 'albumId');
  assertMongoId(organizationId, 'organizationId');

  if (!req.file) {
    const err = new Error('Archivo requerido');
    err.status = 400;
    throw err;
  }

  const album = await Album.findById(albumId);
  if (!album) {
    const err = new Error('Álbum no encontrado');
    err.status = 404;
    throw err;
  }

  const folder = `img-share/org_${organizationId}/album_${albumId}`;

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder,
    resource_type: 'image'
  });

  const image = await Image.create({
    organization: organizationId,
    album: albumId,
    url: result.secure_url,
    publicId: result.public_id,
    originalName: req.file.originalname,
    bytes: result.bytes
  });

  res.json({ ok: true, data: image });
});

/* ======================
   DELETE IMAGE (CLAVE)
====================== */
exports.deleteImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  assertMongoId(id, 'id');

  const image = await Image.findById(id);
  if (!image) {
    const err = new Error('Imagen no encontrada');
    err.status = 404;
    throw err;
  }

  // ☁️ BORRAR DE CLOUDINARY
  await cloudinary.uploader.destroy(image.publicId);

  // 🗑️ BORRAR DE MONGODB
  await Image.deleteOne({ _id: id });

  res.json({ ok: true });
});
