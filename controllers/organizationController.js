const Organization = require('../models/Organization');
const Album = require('../models/Album');
const Image = require('../models/Image');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const { assertNonEmptyString, assertMongoId } = require('../utils/validators');
const { getRedis } = require('../config/redis');

const ORGS_CACHE_KEY = 'imgshare:orgs:v1';
const ORGS_TTL_SECONDS = 60;

exports.createOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;
  assertNonEmptyString(name, 'name');

  const org = await Organization.create({ name: name.trim() });

  const redis = getRedis();
  if (redis) await redis.del(ORGS_CACHE_KEY);

  res.json({ ok: true, data: org });
});

exports.getOrganizations = asyncHandler(async (req, res) => {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(ORGS_CACHE_KEY);
    if (cached) return res.json({ ok: true, data: JSON.parse(cached), cached: true });
  }

  const orgs = await Organization.find().sort({ createdAt: -1 }).lean();

  if (redis) await redis.setEx(ORGS_CACHE_KEY, ORGS_TTL_SECONDS, JSON.stringify(orgs));

  res.json({ ok: true, data: orgs, cached: false });
});

exports.deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertMongoId(id, 'id');

  const org = await Organization.findById(id);
  if (!org) {
    const err = new Error('Organización no encontrada');
    err.status = 404;
    throw err;
  }

  // Obtener todos los álbumes de la organización
  const albums = await Album.find({ organization: id });
  const albumIds = albums.map(a => a._id);

  // Obtener todas las imágenes de los álbumes
  const images = await Image.find({ album: { $in: albumIds } });

  // Eliminar imágenes de Cloudinary
  for (const img of images) {
    await cloudinary.uploader.destroy(img.publicId);
  }

  // Eliminar imágenes de MongoDB
  await Image.deleteMany({ album: { $in: albumIds } });

  // Eliminar álbumes
  await Album.deleteMany({ organization: id });

  // Eliminar organización
  await Organization.deleteOne({ _id: id });

  // Limpiar cache
  const redis = getRedis();
  if (redis) await redis.del(ORGS_CACHE_KEY);

  res.json({ ok: true });
});
