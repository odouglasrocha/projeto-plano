const mongoose = require('mongoose');

const productionRecordSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: true
  },
  operator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    default: null
  },
  produced_quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reject_quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  downtime_minutes: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  recorded_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Downtime tracking fields
  downtime_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DowntimeType',
    default: null
  },
  downtime_start_time: {
    type: Date,
    default: null
  },
  downtime_end_time: {
    type: Date,
    default: null
  },
  downtime_description: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
productionRecordSchema.index({ order_id: 1 });
productionRecordSchema.index({ operator_id: 1 });
productionRecordSchema.index({ recorded_at: -1 });
productionRecordSchema.index({ downtime_type_id: 1 });

module.exports = mongoose.model('ProductionRecord', productionRecordSchema);