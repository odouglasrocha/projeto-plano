const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  model: {
    type: String,
    trim: true,
    default: null
  },
  location: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['running', 'stopped', 'maintenance', 'idle'],
    default: 'idle'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
machineSchema.index({ code: 1 });
machineSchema.index({ status: 1 });
machineSchema.index({ name: 1 });

module.exports = mongoose.model('Machine', machineSchema);