const express = require('express');
const { body, validationResult } = require('express-validator');
const Operator = require('../models/Operator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all operators
router.get('/', auth, async (req, res) => {
  try {
    const operators = await Operator.find().sort({ name: 1 });
    res.json(operators);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get operator by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    res.json(operator);
  } catch (error) {
    console.error('Get operator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create operator
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('code').trim().isLength({ min: 1 }),
  body('role').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, role } = req.body;

    // Check if operator code already exists
    const existingOperator = await Operator.findOne({ code });
    if (existingOperator) {
      return res.status(400).json({ message: 'Operator code already exists' });
    }

    const operator = new Operator({
      name,
      code,
      role
    });

    await operator.save();
    res.status(201).json(operator);
  } catch (error) {
    console.error('Create operator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update operator
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1 }),
  body('code').optional().trim().isLength({ min: 1 }),
  body('role').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating code, check for duplicates
    if (req.body.code) {
      const existingOperator = await Operator.findOne({ 
        code: req.body.code, 
        _id: { $ne: req.params.id } 
      });
      if (existingOperator) {
        return res.status(400).json({ message: 'Operator code already exists' });
      }
    }

    const operator = await Operator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    res.json(operator);
  } catch (error) {
    console.error('Update operator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete operator
router.delete('/:id', auth, async (req, res) => {
  try {
    const operator = await Operator.findByIdAndDelete(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Delete operator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;