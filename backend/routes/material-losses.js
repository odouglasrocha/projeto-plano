const express = require('express');
const { body, validationResult } = require('express-validator');
const MaterialLoss = require('../models/MaterialLoss');
const Machine = require('../models/Machine');
const LossType = require('../models/LossType');
const ProductionOrder = require('../models/ProductionOrder');
const Operator = require('../models/Operator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all material losses
router.get('/', auth, async (req, res) => {
  try {
    const { machine_id, loss_type_id, order_id, operator_id, start_date, end_date } = req.query;
    
    let filter = {};
    
    if (machine_id) filter.machine_id = machine_id;
    if (loss_type_id) filter.loss_type_id = loss_type_id;
    if (order_id) filter.order_id = order_id;
    if (operator_id) filter.operator_id = operator_id;
    
    if (start_date || end_date) {
      filter.recorded_at = {};
      if (start_date) filter.recorded_at.$gte = new Date(start_date);
      if (end_date) filter.recorded_at.$lte = new Date(end_date);
    }

    const losses = await MaterialLoss.find(filter)
      .populate('machine_id', 'name code')
      .populate('loss_type_id', 'name unit color icon')
      .populate('order_id', 'code product_name')
      .populate('operator_id', 'name code')
      .sort({ recorded_at: -1 });
    
    res.json(losses);
  } catch (error) {
    console.error('Get material losses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent material losses
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 10, hours = 24 } = req.query;
    
    // Calculate the date threshold for recent losses
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours));
    
    const recentLosses = await MaterialLoss.find({
      recorded_at: { $gte: hoursAgo }
    })
      .populate('machine_id', 'name code')
      .populate('loss_type_id', 'name unit color icon')
      .populate('order_id', 'code product_name')
      .populate('operator_id', 'name code')
      .sort({ recorded_at: -1 })
      .limit(parseInt(limit));
    
    // Calculate summary statistics for recent losses
    const summary = await MaterialLoss.aggregate([
      { $match: { recorded_at: { $gte: hoursAgo } } },
      {
        $lookup: {
          from: 'losstypes',
          localField: 'loss_type_id',
          foreignField: '_id',
          as: 'loss_type'
        }
      },
      { $unwind: '$loss_type' },
      {
        $addFields: {
          amount_double: { $toDouble: '$amount' }
        }
      },
      {
        $group: {
          _id: null,
          total_amount: { $sum: '$amount_double' },
          total_count: { $sum: 1 },
          avg_amount: { $avg: '$amount_double' },
          loss_types: {
            $addToSet: {
              type_id: '$loss_type_id',
              type_name: '$loss_type.name',
              unit: '$loss_type.unit'
            }
          }
        }
      }
    ]);

    res.json({
      losses: recentLosses,
      summary: summary[0] || {
        total_amount: 0,
        total_count: 0,
        avg_amount: 0,
        loss_types: []
      },
      period: {
        hours: parseInt(hours),
        from: hoursAgo,
        to: new Date()
      }
    });
  } catch (error) {
    console.error('Get recent material losses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get material loss by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const loss = await MaterialLoss.findById(req.params.id)
      .populate('machine_id', 'name code')
      .populate('loss_type_id', 'name unit color icon')
      .populate('order_id', 'code product_name')
      .populate('operator_id', 'name code');
    
    if (!loss) {
      return res.status(404).json({ message: 'Material loss not found' });
    }
    
    res.json(loss);
  } catch (error) {
    console.error('Get material loss error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create material loss
router.post('/', [
  auth,
  body('machine_id').isMongoId(),
  body('loss_type_id').isMongoId(),
  body('order_id').optional({ nullable: true }).isMongoId(),
  body('operator_id').optional({ nullable: true }).isMongoId(),
  body('amount').isFloat({ min: 0 }),
  body('reason').optional().trim(),
  body('recorded_at').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      machine_id,
      loss_type_id,
      order_id,
      operator_id,
      amount,
      reason,
      recorded_at
    } = req.body;

    // Verify all related entities exist
    const machine = await Machine.findById(machine_id);
    if (!machine) {
      return res.status(400).json({ message: 'Machine not found' });
    }

    const lossType = await LossType.findById(loss_type_id);
    if (!lossType) {
      return res.status(400).json({ message: 'Loss type not found' });
    }

    // Only verify order and operator if they are provided
    if (order_id) {
      const order = await ProductionOrder.findById(order_id);
      if (!order) {
        return res.status(400).json({ message: 'Production order not found' });
      }
    }

    if (operator_id) {
      const operator = await Operator.findById(operator_id);
      if (!operator) {
        return res.status(400).json({ message: 'Operator not found' });
      }
    }

    const loss = new MaterialLoss({
      machine_id,
      loss_type_id,
      order_id,
      operator_id,
      amount,
      reason,
      recorded_at: recorded_at ? new Date(recorded_at) : new Date()
    });

    await loss.save();
    
    // Populate related data for response
    await loss.populate([
      { path: 'machine_id', select: 'name code' },
      { path: 'loss_type_id', select: 'name unit color icon' },
      { path: 'order_id', select: 'code product_name' },
      { path: 'operator_id', select: 'name code' }
    ]);
    
    res.status(201).json(loss);
  } catch (error) {
    console.error('Create material loss error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update material loss
router.put('/:id', [
  auth,
  body('machine_id').optional().isMongoId(),
  body('loss_type_id').optional().isMongoId(),
  body('order_id').optional().isMongoId(),
  body('operator_id').optional().isMongoId(),
  body('amount').optional().isFloat({ min: 0 }),
  body('reason').optional().trim(),
  body('recorded_at').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify related entities exist if being updated
    if (req.body.machine_id) {
      const machine = await Machine.findById(req.body.machine_id);
      if (!machine) {
        return res.status(400).json({ message: 'Machine not found' });
      }
    }

    if (req.body.loss_type_id) {
      const lossType = await LossType.findById(req.body.loss_type_id);
      if (!lossType) {
        return res.status(400).json({ message: 'Loss type not found' });
      }
    }

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

    // Convert date string to Date object if provided
    const updateData = { ...req.body };
    if (updateData.recorded_at) updateData.recorded_at = new Date(updateData.recorded_at);

    const loss = await MaterialLoss.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'machine_id', select: 'name code' },
      { path: 'loss_type_id', select: 'name unit color icon' },
      { path: 'order_id', select: 'code product_name' },
      { path: 'operator_id', select: 'name code' }
    ]);

    if (!loss) {
      return res.status(404).json({ message: 'Material loss not found' });
    }

    res.json(loss);
  } catch (error) {
    console.error('Update material loss error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete material loss
router.delete('/:id', auth, async (req, res) => {
  try {
    const loss = await MaterialLoss.findByIdAndDelete(req.params.id);
    if (!loss) {
      return res.status(404).json({ message: 'Material loss not found' });
    }
    res.json({ message: 'Material loss deleted successfully' });
  } catch (error) {
    console.error('Delete material loss error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Get material loss totals (for dashboard)
router.get('/totals/summary', auth, async (req, res) => {
  try {
    const { start_date, end_date, machine_id, loss_type_id } = req.query;
    
    let matchFilter = {};
    
    if (start_date || end_date) {
      matchFilter.recorded_at = {};
      if (start_date) matchFilter.recorded_at.$gte = new Date(start_date);
      if (end_date) matchFilter.recorded_at.$lte = new Date(end_date);
    }
    
    if (machine_id) matchFilter.machine_id = require('mongoose').Types.ObjectId(machine_id);
    if (loss_type_id) matchFilter.loss_type_id = require('mongoose').Types.ObjectId(loss_type_id);

    const totals = await MaterialLoss.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'losstypes',
          localField: 'loss_type_id',
          foreignField: '_id',
          as: 'loss_type'
        }
      },
      { $unwind: '$loss_type' },
      {
        $group: {
          _id: {
            loss_type_id: '$loss_type_id',
            loss_type_name: '$loss_type.name',
            unit: '$loss_type.unit'
          },
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total_amount: -1 } }
    ]);

    res.json(totals);
  } catch (error) {
    console.error('Get material loss totals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;