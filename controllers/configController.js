const Config = require('../models/Config');
const asyncHandler = require('../utils/asyncHandler');
const { assertNonEmptyString } = require('../utils/validators');

exports.getConfig = asyncHandler(async (req, res) => {
  console.log('🔍 GET /api/config called');
  
  // Obtener configuración de Cloudinary
  let cloudinaryConfig = await Config.findOne({ type: 'cloudinary' });
  if (!cloudinaryConfig) {
    cloudinaryConfig = {
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || ''
    };
  }

  // Obtener configuración de Redis
  let redisConfig = await Config.findOne({ type: 'redis' });
  if (!redisConfig) {
    redisConfig = {
      redisHost: process.env.REDIS_HOST || '',
      redisPort: process.env.REDIS_PORT || 6379,
      redisPassword: process.env.REDIS_PASSWORD || ''
    };
  }

  const safeConfig = {
    cloudinary: {
      cloudinaryCloudName: cloudinaryConfig.cloudinaryCloudName,
      cloudinaryApiKey: cloudinaryConfig.cloudinaryApiKey,
      cloudinaryApiSecret: cloudinaryConfig.cloudinaryApiSecret ? '••••••••' : ''
    },
    redis: {
      redisHost: redisConfig.redisHost,
      redisPort: redisConfig.redisPort,
      redisPassword: redisConfig.redisPassword ? '••••••••' : ''
    }
  };

  console.log('✅ Returning config');
  res.json({ ok: true, data: safeConfig });
});

exports.updateConfig = asyncHandler(async (req, res) => {
  const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret, redisHost, redisPort, redisPassword } = req.body;

  // Validar que se envíe algo
  if (!cloudinaryCloudName && !cloudinaryApiKey && !cloudinaryApiSecret && !redisHost && !redisPort && !redisPassword) {
    return res.status(400).json({ ok: false, error: 'Debes enviar al menos una configuración' });
  }

  // Actualizar Cloudinary solo si se proporciona
  if (cloudinaryCloudName || cloudinaryApiKey || cloudinaryApiSecret) {
    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      return res.status(400).json({ ok: false, error: 'Para actualizar Cloudinary, debes proporcionar todos los campos' });
    }

    let cloudinaryConfig = await Config.findOne({ type: 'cloudinary' });
    if (!cloudinaryConfig) {
      cloudinaryConfig = await Config.create({
        type: 'cloudinary',
        cloudinaryCloudName: cloudinaryCloudName.trim(),
        cloudinaryApiKey: cloudinaryApiKey.trim(),
        cloudinaryApiSecret: cloudinaryApiSecret.trim()
      });
    } else {
      cloudinaryConfig.cloudinaryCloudName = cloudinaryCloudName.trim();
      cloudinaryConfig.cloudinaryApiKey = cloudinaryApiKey.trim();
      cloudinaryConfig.cloudinaryApiSecret = cloudinaryApiSecret.trim();
      await cloudinaryConfig.save();
    }

    // Actualizar variables de entorno
    process.env.CLOUDINARY_CLOUD_NAME = cloudinaryConfig.cloudinaryCloudName;
    process.env.CLOUDINARY_API_KEY = cloudinaryConfig.cloudinaryApiKey;
    process.env.CLOUDINARY_API_SECRET = cloudinaryConfig.cloudinaryApiSecret;

    // Reconfigura Cloudinary
    const cloudinary = require('../config/cloudinary');
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudinaryCloudName,
      api_key: cloudinaryConfig.cloudinaryApiKey,
      api_secret: cloudinaryConfig.cloudinaryApiSecret
    });
  }

  // Actualizar Redis solo si se proporciona
  if (redisHost || redisPassword) {
    if (!redisHost || !redisPassword) {
      return res.status(400).json({ ok: false, error: 'Para actualizar Redis, debes proporcionar Host y Password' });
    }

    let redisConfig = await Config.findOne({ type: 'redis' });
    if (!redisConfig) {
      redisConfig = await Config.create({
        type: 'redis',
        redisHost: redisHost.trim(),
        redisPort: Number(redisPort) || 6379,
        redisPassword: redisPassword.trim()
      });
    } else {
      redisConfig.redisHost = redisHost.trim();
      redisConfig.redisPort = Number(redisPort) || 6379;
      redisConfig.redisPassword = redisPassword.trim();
      await redisConfig.save();
    }

    // Actualizar variables de entorno
    process.env.REDIS_HOST = redisConfig.redisHost;
    process.env.REDIS_PORT = redisConfig.redisPort;
    process.env.REDIS_PASSWORD = redisConfig.redisPassword;

    console.log('⚠️ Redis será reconectado en la próxima conexión');
  }

  res.json({ ok: true, message: 'Configuración actualizada correctamente' });
});
