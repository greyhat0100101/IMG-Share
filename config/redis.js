const { createClient } = require('redis');

let client;

async function connectRedis() {
  if (client) return client;

  // Intentar cargar desde .env primero
  let host = process.env.REDIS_HOST;
  let port = process.env.REDIS_PORT;
  let password = process.env.REDIS_PASSWORD;

  // Si no está en .env, intentar cargar desde BD
  if (!host || !port || !password) {
    try {
      const Config = require('../models/Config');
      const redisConfig = await Config.findOne({ type: 'redis' });
      if (redisConfig && redisConfig.redisHost && redisConfig.redisPort && redisConfig.redisPassword) {
        host = redisConfig.redisHost;
        port = redisConfig.redisPort;
        password = redisConfig.redisPassword;
        console.log('📦 Redis cargado desde MongoDB');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo cargar Redis de MongoDB');
    }
  }

  if (!host || !port || !password) {
    console.warn('⏳ Redis no está configurado. Se configurará en Settings');
    return null;
  }

  client = createClient({
    socket: { host, port: Number(port) },
    password
  });

  client.on('error', (err) => console.error('Redis error:', err));

  await client.connect();
  console.log('⚡ Redis conectado');
  return client;
}

function getRedis() {
  return client || null;
}

function setRedisClient(newClient) {
  client = newClient;
}

module.exports = { connectRedis, getRedis, setRedisClient };
