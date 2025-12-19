const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 }
  },
  { timestamps: true }
);

OrganizationSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Organization', OrganizationSchema);
