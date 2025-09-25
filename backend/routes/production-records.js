const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const ProductionRecord = require('../models/ProductionRecord');
const ProductionOrder = require('../models/ProductionOrder');
const Operator = require('../models/Operator');
const DowntimeType = require('../models/DowntimeType');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all production records
router.get('/', auth, async (req, res) => {
  try {
    const { order_id, operator_id, start_date, end_date } = req.query;
    
    let filter = {};
    
    if (order_id) filter.order_id = order_id;
    if (operator_id) filter.operator_id = operator_id;
    
    if (start_date || end_date) {
      filter.recorded_at = {};
      if (start_date) filter.recorded_at.$gte = new Date(start_date);
      if (end_date) filter.recorded_at.$lte = new Date(end_date);
    }

    const records = await ProductionRecord.find(filter)
      .populate('order_id', 'code product_name')
      .populate('operator_id', 'name code')
      .populate('downtime_type_id', 'name category')
      .sort({ recorded_at: -1 });
    
    res.json(records);
  } catch (error) {
    console.error('Get production records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get production record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await ProductionRecord.findById(req.params.id)
      .populate('order_id', 'code product_name')
      .populate('operator_id', 'name code')
      .populate('downtime_type_id', 'name category');
    
    if (!record) {
      return res.status(404).json({ message: 'Production record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Get production record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create production record
router.post('/', [
  auth,
  body('order_id').isMongoId(),
  body('operator_id').optional({ nullable: true }).isMongoId(),
  body('produced_quantity').isInt({ min: 0 }),
  body('reject_quantity').isInt({ min: 0 }),
  body('downtime_minutes').isInt({ min: 0 }),
  body('recorded_at').optional().isISO8601(),
  body('downtime_type_id').optional({ nullable: true }).isMongoId(),
  body('downtime_start_time').optional().isISO8601(),
  body('downtime_end_time').optional().isISO8601(),
  body('downtime_description').optional().trim()
], async (req, res) => {
  try {
    console.log('POST /api/production-records - Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      order_id,
      operator_id,
      produced_quantity,
      reject_quantity,
      downtime_minutes,
      recorded_at,
      downtime_type_id,
      downtime_start_time,
      downtime_end_time,
      downtime_description
    } = req.body;

    // Verify production order exists
    const order = await ProductionOrder.findById(order_id);
    if (!order) {
      return res.status(400).json({ message: 'Production order not found' });
    }

    // Verify operator exists (only if operator_id is provided)
    if (operator_id) {
      const operator = await Operator.findById(operator_id);
      if (!operator) {
        return res.status(400).json({ message: 'Operator not found' });
      }
    }

    // If downtime_type_id is provided, verify it exists
    if (downtime_type_id) {
      const downtimeType = await DowntimeType.findById(downtime_type_id);
      if (!downtimeType) {
        return res.status(400).json({ message: 'Downtime type not found' });
      }
    }

    console.log('=== DEBUG: Iniciando verificação de registro existente ===');
    console.log('order_id recebido:', order_id);
    console.log('Tipo do order_id:', typeof order_id);
    
    // Check if there's already a production record for this order
    const objectId = new mongoose.Types.ObjectId(order_id);
    console.log('ObjectId convertido:', objectId);
    
    const existingRecord = await ProductionRecord.findOne({ order_id: objectId });
    console.log('Registro existente encontrado:', existingRecord ? 'SIM' : 'NÃO');
    
    if (existingRecord) {
      console.log('=== ATUALIZANDO REGISTRO EXISTENTE ===');
      console.log('ID do registro existente:', existingRecord._id);
      console.log('Quantidades antes da atualização:');
      console.log('- produced_quantity:', existingRecord.produced_quantity);
      console.log('- reject_quantity:', existingRecord.reject_quantity);
      console.log('- downtime_minutes:', existingRecord.downtime_minutes);
      
      // Update existing record by adding the new quantity
      existingRecord.produced_quantity += produced_quantity;
      existingRecord.reject_quantity += (reject_quantity || 0);
      existingRecord.downtime_minutes += (downtime_minutes || 0);
      existingRecord.recorded_at = recorded_at ? new Date(recorded_at) : new Date();
      
      console.log('Quantidades após a soma:');
      console.log('- produced_quantity:', existingRecord.produced_quantity);
      console.log('- reject_quantity:', existingRecord.reject_quantity);
      console.log('- downtime_minutes:', existingRecord.downtime_minutes);
      
      // Update downtime fields if provided
      console.log('Verificando downtime_type_id:', downtime_type_id, 'Tipo:', typeof downtime_type_id);
      if (downtime_type_id && downtime_type_id.trim() !== '') {
        existingRecord.downtime_type_id = downtime_type_id;
        console.log('downtime_type_id atualizado para:', downtime_type_id);
      }
      if (downtime_start_time) existingRecord.downtime_start_time = new Date(downtime_start_time);
      if (downtime_end_time) existingRecord.downtime_end_time = new Date(downtime_end_time);
      if (downtime_description !== undefined) existingRecord.downtime_description = downtime_description;
      
      await existingRecord.save();
      console.log('Registro atualizado e salvo com sucesso');
      
      // Populate related data for response
      await existingRecord.populate([
        { path: 'order_id', select: 'code product_name' },
        { path: 'operator_id', select: 'name code' },
        { path: 'downtime_type_id', select: 'name category' }
      ]);
      
      console.log('Updated existing record:', existingRecord);
      res.status(200).json(existingRecord);
    } else {
      console.log('=== CRIANDO NOVO REGISTRO ===');
      console.log('Dados do novo registro:');
      console.log('- order_id:', order_id);
      console.log('- operator_id:', operator_id);
      console.log('- produced_quantity:', produced_quantity);
      console.log('- reject_quantity:', reject_quantity);
      console.log('- downtime_minutes:', downtime_minutes);
      
      // Create new record
      console.log('Verificando downtime_type_id para novo registro:', downtime_type_id, 'Tipo:', typeof downtime_type_id);
      const record = new ProductionRecord({
        order_id,
        operator_id,
        produced_quantity,
        reject_quantity: reject_quantity || 0,
        downtime_minutes: downtime_minutes || 0,
        recorded_at: recorded_at ? new Date(recorded_at) : new Date(),
        downtime_type_id: downtime_type_id && downtime_type_id.trim() !== '' ? downtime_type_id : null,
        downtime_start_time: downtime_start_time ? new Date(downtime_start_time) : null,
        downtime_end_time: downtime_end_time ? new Date(downtime_end_time) : null,
        downtime_description
      });

      await record.save();
      console.log('Novo registro criado com ID:', record._id);
      
      // Populate related data for response
      await record.populate([
        { path: 'order_id', select: 'code product_name' },
        { path: 'operator_id', select: 'name code' },
        { path: 'downtime_type_id', select: 'name category' }
      ]);
      
      console.log('Created new record:', record);
      res.status(201).json(record);
    }
  } catch (error) {
    console.error('Create production record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update production record
router.put('/:id', [
  auth,
  body('order_id').optional().isMongoId(),
  body('operator_id').optional({ nullable: true }).isMongoId(),
  body('produced_quantity').optional().isInt({ min: 0 }),
  body('reject_quantity').optional().isInt({ min: 0 }),
  body('downtime_minutes').optional().isInt({ min: 0 }),
  body('recorded_at').optional().isISO8601(),
  body('downtime_type_id').optional({ nullable: true }).isMongoId(),
  body('downtime_start_time').optional().isISO8601(),
  body('downtime_end_time').optional().isISO8601(),
  body('downtime_description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify related entities exist if being updated
    if (req.body.order_id) {
      const order = await ProductionOrder.findById(req.body.order_id);
      if (!order) {
        return res.status(400).json({ message: 'Production order not found' });
      }
    }

    if (req.body.operator_id) {
      const operator = await Operator.findById(req.body.operator_id);
      if (!operator) {
        return res.status(400).json({ message: 'Operator not found' });
      }
    }

    if (req.body.downtime_type_id) {
      const downtimeType = await DowntimeType.findById(req.body.downtime_type_id);
      if (!downtimeType) {
        return res.status(400).json({ message: 'Downtime type not found' });
      }
    }

    // Convert date strings to Date objects
    const updateData = { ...req.body };
    if (updateData.recorded_at) updateData.recorded_at = new Date(updateData.recorded_at);
    if (updateData.downtime_start_time) updateData.downtime_start_time = new Date(updateData.downtime_start_time);
    if (updateData.downtime_end_time) updateData.downtime_end_time = new Date(updateData.downtime_end_time);

    const record = await ProductionRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'order_id', select: 'code product_name' },
      { path: 'operator_id', select: 'name code' },
      { path: 'downtime_type_id', select: 'name category' }
    ]);

    if (!record) {
      return res.status(404).json({ message: 'Production record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Update production record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete production record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await ProductionRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Production record not found' });
    }
    res.json({ message: 'Production record deleted successfully' });
  } catch (error) {
    console.error('Delete production record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get production totals (for dashboard)
router.get('/totals/summary', auth, async (req, res) => {
  try {
    const { start_date, end_date, order_id } = req.query;
    
    let matchFilter = {};
    
    if (start_date || end_date) {
      matchFilter.recorded_at = {};
      if (start_date) matchFilter.recorded_at.$gte = new Date(start_date);
      if (end_date) matchFilter.recorded_at.$lte = new Date(end_date);
    }
    
    if (order_id) matchFilter.order_id = require('mongoose').Types.ObjectId(order_id);

    const totals = await ProductionRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total_produced: { $sum: '$produced_quantity' },
          total_rejected: { $sum: '$reject_quantity' },
          total_downtime: { $sum: '$downtime_minutes' },
          record_count: { $sum: 1 }
        }
      }
    ]);

    const result = totals[0] || {
      total_produced: 0,
      total_rejected: 0,
      total_downtime: 0,
      record_count: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get production totals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;