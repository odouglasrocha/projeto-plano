const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
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
  role: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
operatorSchema.index({ code: 1 });
operatorSchema.index({ name: 1 });

module.exports = mongoose.model('Operator', operatorSchema);