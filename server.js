require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'IMG-Share', time: new Date().toISOString() });
});

app.use('/api/organizations', require('./routes/organizationRoutes'));
app.use('/api/albums', require('./routes/albumRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

app.use(notFound);
app.use(errorHandler);

async function boot() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await connectDB();
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    // No salir si MongoDB falla, continuar sin cache
  }

  try {
    console.log('🔌 Conectando a Redis...');
    await connectRedis();
    console.log('✅ Redis conectado');
  } catch (error) {
    console.warn('⚠️ Redis no disponible, continuando sin cache:', error.message);
    // No salir si Redis falla, es opcional
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en puerto ${port}`);
  });
}

boot().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
