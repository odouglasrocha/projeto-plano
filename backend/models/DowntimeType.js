const mongoose = require('mongoose');

const downtimeTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['equipment', 'material', 'operator', 'other'],
    default: 'equipment'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
downtimeTypeSchema.index({ name: 1 });
downtimeTypeSchema.index({ category: 1 });

module.exports = mongoose.model('DowntimeType', downtimeTypeSchema);