const express = require('express');
const { body, validationResult } = require('express-validator');
const Machine = require('../models/Machine');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all machines
router.get('/', auth, async (req, res) => {
  try {
    const machines = await Machine.find().sort({ name: 1 });
    res.json(machines);
  } catch (error) {
    console.error('Get machines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get machine by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json(machine);
  } catch (error) {
    console.error('Get machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create machine
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('code').trim().isLength({ min: 1 }),
  body('model').optional().trim(),
  body('location').optional().trim(),
  body('status').optional().isIn(['running', 'stopped', 'maintenance', 'idle'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, model, location, status } = req.body;

    // Check if machine code already exists
    const existingMachine = await Machine.findOne({ code });
    if (existingMachine) {
      return res.status(400).json({ message: 'Machine code already exists' });
    }

    const machine = new Machine({
      name,
      code,
      model,
      location,
      status: status || 'idle'
    });

    await machine.save();
    res.status(201).json(machine);
  } catch (error) {
    console.error('Create machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update machine
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1 }),
  body('code').optional().trim().isLength({ min: 1 }),
  body('model').optional().trim(),
  body('location').optional().trim(),
  body('status').optional().isIn(['running', 'stopped', 'maintenance', 'idle'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating code, check for duplicates
    if (req.body.code) {
      const existingMachine = await Machine.findOne({ 
        code: req.body.code, 
        _id: { $ne: req.params.id } 
      });
      if (existingMachine) {
        return res.status(400).json({ message: 'Machine code already exists' });
      }
    }

    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    console.error('Update machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete machine
router.delete('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    console.error('Delete machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;