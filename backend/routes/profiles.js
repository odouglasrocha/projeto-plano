const express = require('express');
const { body, validationResult } = require('express-validator');
const Profile = require('../models/Profile');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all profiles (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ created_at: -1 });
    res.json(profiles);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create profile
router.post('/', [
  auth,
  body('email').isEmail().normalizeEmail(),
  body('full_name').trim().isLength({ min: 1 }),
  body('role').isIn(['admin', 'supervisor', 'planner', 'operator'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, full_name, role } = req.body;

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    const profile = new Profile({
      email,
      full_name,
      role
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/:id', [
  auth,
  body('full_name').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['admin', 'supervisor', 'planner', 'operator'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete profile
router.delete('/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;