const express = require('express');
const { body, validationResult } = require('express-validator');
const ProductionOrder = require('../models/ProductionOrder');
const Machine = require('../models/Machine');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all production orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await ProductionOrder.find()
      .populate('machine_id', 'name code')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get production orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get production order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await ProductionOrder.findById(req.params.id)
      .populate('machine_id', 'name code');
    if (!order) {
      return res.status(404).json({ message: 'Production order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get production order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create production order
router.post('/', [
  auth,
  body('code').trim().isLength({ min: 1 }),
  body('product_name').trim().isLength({ min: 1 }),
  body('machine_id').isMongoId(),
  body('planned_quantity').isInt({ min: 1 }),
  body('pallet_quantity').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['planejada', 'em_andamento', 'concluida', 'cancelada']),
  body('shift').optional().isIn(['manha', 'tarde', 'noite'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, product_name, machine_id, planned_quantity, pallet_quantity, status, shift } = req.body;

    // Check if production order code already exists
    const existingOrder = await ProductionOrder.findOne({ code });
    if (existingOrder) {
      return res.status(400).json({ message: 'Production order code already exists' });
    }

    // Verify machine exists
    const machine = await Machine.findById(machine_id);
    if (!machine) {
      return res.status(400).json({ message: 'Machine not found' });
    }

    const order = new ProductionOrder({
      code,
      product_name,
      machine_id,
      planned_quantity,
      pallet_quantity,
      status: status || 'planejada',
      shift
    });

    await order.save();
    
    // Populate machine data for response
    await order.populate('machine_id', 'name code');
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Create production order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update production order
router.put('/:id', [
  auth,
  body('code').optional().trim().isLength({ min: 1 }),
  body('product_name').optional().trim().isLength({ min: 1 }),
  body('machine_id').optional().isMongoId(),
  body('planned_quantity').optional().isInt({ min: 1 }),
  body('pallet_quantity').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['planejada', 'em_andamento', 'concluida', 'cancelada']),
  body('shift').optional().isIn(['manha', 'tarde', 'noite'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating code, check for duplicates
    if (req.body.code) {
      const existingOrder = await ProductionOrder.findOne({ 
        code: req.body.code, 
        _id: { $ne: req.params.id } 
      });
      if (existingOrder) {
        return res.status(400).json({ message: 'Production order code already exists' });
      }
    }

    // If updating machine, verify it exists
    if (req.body.machine_id) {
      const machine = await Machine.findById(req.body.machine_id);
      if (!machine) {
        return res.status(400).json({ message: 'Machine not found' });
      }
    }

    const order = await ProductionOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('machine_id', 'name code');

    if (!order) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update production order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete production order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await ProductionOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Production order not found' });
    }
    res.json({ message: 'Production order deleted successfully' });
  } catch (error) {
    console.error('Delete production order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;