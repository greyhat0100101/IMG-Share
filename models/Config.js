const mongoose = require('mongoose');

const CloudinaryConfigSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['cloudinary'], required: true, unique: true },
    cloudinaryCloudName: { type: String, required: true },
    cloudinaryApiKey: { type: String, required: true },
    cloudinaryApiSecret: { type: String, required: true }
  },
  { timestamps: true }
);

const RedisConfigSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['redis'], required: true, unique: true },
    redisHost: { type: String, required: true },
    redisPort: { type: Number, required: true },
    redisPassword: { type: String, required: true }
  },
  { timestamps: true }
);

const ConfigSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['cloudinary', 'redis'], required: true, unique: true },
    cloudinaryCloudName: { type: String },
    cloudinaryApiKey: { type: String },
    cloudinaryApiSecret: { type: String },
    redisHost: { type: String },
    redisPort: { type: Number },
    redisPassword: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Config', ConfigSchema);
