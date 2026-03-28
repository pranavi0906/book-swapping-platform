const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const complaintService = require('../utils/complaintService');

// File a new complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { swapRequestId, complaintType, description } = req.body;
    const complainantId = req.user.id;

    if (!swapRequestId || !complaintType || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const complaint = await complaintService.fileComplaint({
      swapRequestId,
      complainantId,
      complaintType,
      description
    });

    res.status(201).json({
      message: 'Complaint filed successfully',
      complaint: {
        id: complaint._id,
        complaintId: complaint.complaintId,
        status: complaint.status,
        createdAt: complaint.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get user's complaints
router.get('/my-complaints', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const complaints = await complaintService.getUserComplaints(userId);
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get all complaints (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, complaintType } = req.query;
    const complaints = await complaintService.getAllComplaints({ status, complaintType });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Resolve complaint (admin only)
router.put('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { resolution, penaltyApplied, trustScoreAdjustment } = req.body;
    const adminId = req.user.id;

    if (!resolution) {
      return res.status(400).json({ message: 'Resolution is required' });
    }

    const complaint = await complaintService.resolveComplaint(
      id,
      adminId,
      resolution,
      penaltyApplied || 0,
      trustScoreAdjustment || 0
    );

    res.json({
      message: 'Complaint resolved successfully',
      complaint
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Dismiss complaint (admin only)
router.put('/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: 'Dismissal reason is required' });
    }

    const complaint = await complaintService.dismissComplaint(id, adminId, reason);

    res.json({
      message: 'Complaint dismissed successfully',
      complaint
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get complaint statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const stats = await complaintService.getComplaintStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
