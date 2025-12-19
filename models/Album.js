const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
  },
  { timestamps: true }
);

AlbumSchema.index({ organization: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Album', AlbumSchema);
