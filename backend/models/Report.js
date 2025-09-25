const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  format: {
    type: String,
    required: true,
    default: 'pdf',
    enum: ['pdf', 'excel', 'csv']
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  file_path: {
    type: String,
    trim: true,
    default: null
  },
  file_size: {
    type: Number,
    min: 0,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
reportSchema.index({ created_by: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ created_at: -1 });

module.exports = mongoose.model('Report', reportSchema);