const cloudinary = require('cloudinary').v2;

function initCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  // Si las credenciales están en .env, usarlas
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configurado desde .env');
  } else {
    console.log('⏳ Cloudinary se configurará desde la base de datos al ingresar en Settings');
  }

  return cloudinary;
}

module.exports = initCloudinary();
