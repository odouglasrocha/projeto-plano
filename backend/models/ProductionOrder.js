const mongoose = require('mongoose');

const productionOrderSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  product_name: {
    type: String,
    required: true,
    trim: true
  },
  machine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  planned_quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pallet_quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['planejada', 'em_andamento', 'concluida', 'cancelada'],
    default: 'planejada'
  },
  shift: {
    type: String,
    required: true,
    enum: ['manha', 'tarde', 'noite'],
    default: 'manha'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
productionOrderSchema.index({ code: 1 });
productionOrderSchema.index({ machine_id: 1 });
productionOrderSchema.index({ status: 1 });
productionOrderSchema.index({ created_at: -1 });

module.exports = mongoose.model('ProductionOrder', productionOrderSchema);