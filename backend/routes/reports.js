const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all reports
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, created_by } = req.query;
    
    let filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (created_by) filter.created_by = created_by;

    const reports = await Report.find(filter)
      .populate('created_by', 'email raw_user_meta_data.full_name')
      .sort({ created_at: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get report by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('created_by', 'email raw_user_meta_data.full_name');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create report
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('type').trim().isLength({ min: 1 }),
  body('format').isIn(['pdf', 'excel', 'csv']),
  body('parameters').optional().isObject(),
  body('file_path').optional().trim(),
  body('file_size').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      type,
      format,
      parameters,
      file_path,
      file_size
    } = req.body;

    const report = new Report({
      name,
      type,
      format,
      parameters: parameters || {},
      file_path,
      file_size,
      status: file_path ? 'completed' : 'pending',
      created_by: req.user._id,
      completed_at: file_path ? new Date() : null
    });

    await report.save();
    
    // Populate created_by for response
    await report.populate('created_by', 'email raw_user_meta_data.full_name');
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1 }),
  body('type').optional().trim().isLength({ min: 1 }),
  body('format').optional().isIn(['pdf', 'excel', 'csv']),
  body('parameters').optional().isObject(),
  body('file_path').optional().trim(),
  body('file_size').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['pending', 'processing', 'completed', 'failed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = { ...req.body };
    
    // If status is being updated to completed and no completed_at exists, set it
    if (updateData.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date();
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'email raw_user_meta_data.full_name');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate production report
router.post('/generate/production', [
  auth,
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('format').isIn(['pdf', 'excel', 'csv']),
  body('machine_ids').optional().isArray(),
  body('operator_ids').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date, format, machine_ids, operator_ids } = req.body;

    // Create report record
    const report = new Report({
      name: `Production Report - ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}`,
      type: 'production',
      format,
      parameters: {
        start_date,
        end_date,
        machine_ids: machine_ids || [],
        operator_ids: operator_ids || []
      },
      status: 'processing',
      created_by: req.user._id
    });

    await report.save();
    await report.populate('created_by', 'email raw_user_meta_data.full_name');

    // In a real implementation, you would trigger report generation here
    // For now, we'll just return the report record
    res.status(201).json({
      message: 'Report generation started',
      report
    });
  } catch (error) {
    console.error('Generate production report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate losses report
router.post('/generate/losses', [
  auth,
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('format').isIn(['pdf', 'excel', 'csv']),
  body('machine_ids').optional().isArray(),
  body('loss_type_ids').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date, format, machine_ids, loss_type_ids } = req.body;

    // Create report record
    const report = new Report({
      name: `Losses Report - ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}`,
      type: 'losses',
      format,
      parameters: {
        start_date,
        end_date,
        machine_ids: machine_ids || [],
        loss_type_ids: loss_type_ids || []
      },
      status: 'processing',
      created_by: req.user._id
    });

    await report.save();
    await report.populate('created_by', 'email raw_user_meta_data.full_name');

    // In a real implementation, you would trigger report generation here
    // For now, we'll just return the report record
    res.status(201).json({
      message: 'Report generation started',
      report
    });
  } catch (error) {
    console.error('Generate losses report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;