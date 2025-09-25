const express = require('express');
const { body, validationResult } = require('express-validator');
const LossType = require('../models/LossType');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all loss types
router.get('/', auth, async (req, res) => {
  try {
    const lossTypes = await LossType.find().sort({ name: 1 });
    res.json(lossTypes);
  } catch (error) {
    console.error('Get loss types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get loss type by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const lossType = await LossType.findById(req.params.id);
    if (!lossType) {
      return res.status(404).json({ message: 'Loss type not found' });
    }
    res.json(lossType);
  } catch (error) {
    console.error('Get loss type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create loss type
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('unit').trim().isLength({ min: 1 }),
  body('color').optional().trim(),
  body('icon').optional().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, unit, color, icon, description } = req.body;

    // Check if loss type name already exists
    const existingLossType = await LossType.findOne({ name });
    if (existingLossType) {
      return res.status(400).json({ message: 'Loss type name already exists' });
    }

    const lossType = new LossType({
      name,
      unit,
      color: color || '#6B7280',
      icon: icon || 'AlertTriangle',
      description
    });

    await lossType.save();
    res.status(201).json(lossType);
  } catch (error) {
    console.error('Create loss type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update loss type
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1 }),
  body('unit').optional().trim().isLength({ min: 1 }),
  body('color').optional().trim(),
  body('icon').optional().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating name, check for duplicates
    if (req.body.name) {
      const existingLossType = await LossType.findOne({ 
        name: req.body.name, 
        _id: { $ne: req.params.id } 
      });
      if (existingLossType) {
        return res.status(400).json({ message: 'Loss type name already exists' });
      }
    }

    const lossType = await LossType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lossType) {
      return res.status(404).json({ message: 'Loss type not found' });
    }

    res.json(lossType);
  } catch (error) {
    console.error('Update loss type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete loss type
router.delete('/:id', auth, async (req, res) => {
  try {
    const lossType = await LossType.findByIdAndDelete(req.params.id);
    if (!lossType) {
      return res.status(404).json({ message: 'Loss type not found' });
    }
    res.json({ message: 'Loss type deleted successfully' });
  } catch (error) {
    console.error('Delete loss type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;