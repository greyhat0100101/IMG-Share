const Album = require('../models/Album');
const Organization = require('../models/Organization');
const Image = require('../models/Image');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const { assertNonEmptyString, assertMongoId } = require('../utils/validators');

exports.createAlbum = asyncHandler(async (req, res) => {
  const { name, organizationId } = req.body;
  assertNonEmptyString(name, 'name');
  assertMongoId(organizationId, 'organizationId');

  const org = await Organization.findById(organizationId);
  if (!org) {
    const err = new Error('Organización no encontrada');
    err.status = 404;
    throw err;
  }

  const album = await Album.create({
    name: name.trim(),
    organization: organizationId
  });

  res.json({ ok: true, data: album });
});

exports.getAlbumsByOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  assertMongoId(organizationId, 'organizationId');

  const albums = await Album.find({ organization: organizationId }).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, data: albums });
});

exports.deleteAlbum = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertMongoId(id, 'id');

  const album = await Album.findById(id);
  if (!album) {
    const err = new Error('Álbum no encontrado');
    err.status = 404;
    throw err;
  }

  // Obtener todas las imágenes del álbum
  const images = await Image.find({ album: id });

  // Eliminar imágenes de Cloudinary
  for (const img of images) {
    await cloudinary.uploader.destroy(img.publicId);
  }

  // Eliminar imágenes de MongoDB
  await Image.deleteMany({ album: id });

  // Eliminar álbum
  await Album.deleteOne({ _id: id });

  res.json({ ok: true });
});
