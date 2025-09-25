const mongoose = require('mongoose');

const lossTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    default: 'kg',
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: 'bg-gray-500',
    trim: true
  },
  icon: {
    type: String,
    required: true,
    default: '❓',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
lossTypeSchema.index({ name: 1 });

module.exports = mongoose.model('LossType', lossTypeSchema);