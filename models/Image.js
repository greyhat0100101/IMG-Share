const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String, default: '' },
    bytes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ImageSchema.index({ album: 1, createdAt: -1 });

module.exports = mongoose.model('Image', ImageSchema);
