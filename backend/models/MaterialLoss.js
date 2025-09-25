const mongoose = require('mongoose');

const materialLossSchema = new mongoose.Schema({
  machine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  loss_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LossType',
    required: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    default: null
  },
  operator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    default: null
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  recorded_at: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
materialLossSchema.index({ machine_id: 1 });
materialLossSchema.index({ loss_type_id: 1 });
materialLossSchema.index({ order_id: 1 });
materialLossSchema.index({ operator_id: 1 });
materialLossSchema.index({ recorded_at: -1 });

module.exports = mongoose.model('MaterialLoss', materialLossSchema);