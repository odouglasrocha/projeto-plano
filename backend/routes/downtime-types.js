const express = require('express');
const { body, validationResult } = require('express-validator');
const DowntimeType = require('../models/DowntimeType');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all downtime types
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    
    if (category) {
      filter.category = category;
    }

    const downtimeTypes = await DowntimeType.find(filter).sort({ name: 1 });
    res.json(downtimeTypes);
  } catch (error) {
    console.error('Get downtime types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get downtime type by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const downtimeType = await DowntimeType.findById(req.params.id);
    if (!downtimeType) {
      return res.status(404).json({ message: 'Downtime type not found' });
    }
    res.json(downtimeType);
  } catch (error) {
    console.error('Get downtime type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create downtime type
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('category').isIn(['equipment', 'material', 'operator', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category } = req.body;

    // Check if downtime type name already exists
    const existingDowntimeType = await DowntimeType.findOne({ name });
    if (existingDowntimeType) {
      return res.status(400).json({ message: 'Downtime type name already exists' });
    }

    const downtimeType = new DowntimeType({
      name,
      description,
      category
    });

    await downtimeType.save();
    res.status(201).json(downtimeType);
  } catch (error) {
    console.error('Create downtime type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update downtime type
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('category').optional().isIn(['equipment', 'material', 'operator', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating name, check for duplicates
    if (req.body.name) {
      const existingDowntimeType = await DowntimeType.findOne({ 
        name: req.body.name, 
        _id: { $ne: req.params.id } 
      });
      if (existingDowntimeType) {
        return res.status(400).json({ message: 'Downtime type name already exists' });
      }
    }

    const downtimeType = await DowntimeType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!downtimeType) {
      return res.status(404).json({ message: 'Downtime type not found' });
    }

    res.json(downtimeType);
  } catch (error) {
    console.error('Update downtime type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete downtime type
router.delete('/:id', auth, async (req, res) => {
  try {
    const downtimeType = await DowntimeType.findByIdAndDelete(req.params.id);
    if (!downtimeType) {
      return res.status(404).json({ message: 'Downtime type not found' });
    }
    res.json({ message: 'Downtime type deleted successfully' });
  } catch (error) {
    console.error('Delete downtime type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;