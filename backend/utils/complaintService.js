const Complaint = require('../models/Complaint');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('./emailService');
const trustScoreService = require('./trustScoreService');
const restrictionService = require('./restrictionService');

class ComplaintService {
  // File a new complaint
  async fileComplaint(complaintData) {
    try {
      const { swapRequestId, complainantId, complaintType, description } = complaintData;

      // Validate swap request exists and user is involved
      const swap = await SwapRequest.findById(swapRequestId).populate('requesterId').populate('ownerId');
      if (!swap) {
        throw new Error('Swap request not found');
      }

      // Determine defendant (the other party)
      let defendantId;
      if (swap.ownerId._id.toString() === complainantId) {
        defendantId = swap.requesterId._id;
      } else if (swap.requesterId._id.toString() === complainantId) {
        defendantId = swap.ownerId._id;
      } else {
        throw new Error('User is not involved in this swap');
      }

      // Generate unique complaint ID
      const complaintId = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create complaint
      const complaint = new Complaint({
        complaintId,
        swapRequestId,
        complainantId,
        defendantId,
        complaintType,
        description,
        status: 'pending'
      });

      await complaint.save();

      // Notify defendant
      const defendant = await User.findById(defendantId);
      if (defendant && defendant.email) {
        const emailContent = emailTemplates.complaintFiled(
          defendant.username,
          swap.bookId.title,
          complaintType
        );
        await sendEmail(defendant.email, emailContent.subject, emailContent.text);
      }

      console.log(`Complaint ${complaintId} filed by user ${complainantId} against ${defendantId}`);
      return complaint;
    } catch (error) {
      console.error('Error filing complaint:', error);
      throw error;
    }
  }

  // Get complaints for a user (as complainant or defendant)
  async getUserComplaints(userId) {
    try {
      const complaints = await Complaint.find({
        $or: [{ complainantId: userId }, { defendantId: userId }]
      })
      .populate('swapRequestId')
      .populate('complainantId', 'username')
      .populate('defendantId', 'username')
      .populate('adminId', 'username')
      .sort({ createdAt: -1 });

      return complaints;
    } catch (error) {
      console.error('Error getting user complaints:', error);
      throw error;
    }
  }

  // Get all complaints (admin only)
  async getAllComplaints(filters = {}) {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.complaintType) query.complaintType = filters.complaintType;

      const complaints = await Complaint.find(query)
        .populate('swapRequestId')
        .populate('complainantId', 'username email')
        .populate('defendantId', 'username email')
        .populate('adminId', 'username')
        .sort({ createdAt: -1 });

      return complaints;
    } catch (error) {
      console.error('Error getting all complaints:', error);
      throw error;
    }
  }

  // Update complaint status and resolution (admin only)
  async resolveComplaint(complaintId, adminId, resolution, penaltyApplied = 0, trustScoreAdjustment = 0) {
    try {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      // Update complaint
      complaint.status = 'resolved';
      complaint.adminId = adminId;
      complaint.resolution = resolution;
      complaint.penaltyApplied = penaltyApplied;
      complaint.trustScoreAdjustment = trustScoreAdjustment;
      await complaint.save();

      // Apply penalties/rewards if specified
      if (penaltyApplied > 0 || trustScoreAdjustment !== 0) {
        const defendant = await User.findById(complaint.defendantId);
        if (defendant) {
          // Apply penalty points
          if (penaltyApplied > 0) {
            defendant.penaltyPoints += penaltyApplied;
          }

          // Adjust trust score
          if (trustScoreAdjustment !== 0) {
            defendant.trustScore = Math.max(0, Math.min(100, defendant.trustScore + trustScoreAdjustment));
          }

          await defendant.save();

          // Apply restrictions if penalty was applied
          if (penaltyApplied > 0) {
            await restrictionService.applyRestrictions(complaint.defendantId);
          }
        }
      }

      // Notify both parties
      const complainant = await User.findById(complaint.complainantId);
      const defendant = await User.findById(complaint.defendantId);
      const swap = await SwapRequest.findById(complaint.swapRequestId);

      if (complainant && complainant.email) {
        const emailContent = emailTemplates.complaintResolved(
          complainant.username,
          swap.bookId.title,
          resolution,
          penaltyApplied
        );
        await sendEmail(complainant.email, emailContent.subject, emailContent.text);
      }

      if (defendant && defendant.email) {
        const emailContent = emailTemplates.complaintResolved(
          defendant.username,
          swap.bookId.title,
          resolution,
          penaltyApplied
        );
        await sendEmail(defendant.email, emailContent.subject, emailContent.text);
      }

      console.log(`Complaint ${complaintId} resolved by admin ${adminId}`);
      return complaint;
    } catch (error) {
      console.error('Error resolving complaint:', error);
      throw error;
    }
  }

  // Dismiss complaint (admin only)
  async dismissComplaint(complaintId, adminId, reason) {
    try {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      complaint.status = 'dismissed';
      complaint.adminId = adminId;
      complaint.resolution = `Dismissed: ${reason}`;
      await complaint.save();

      // Notify complainant
      const complainant = await User.findById(complaint.complainantId);
      if (complainant && complainant.email) {
        const emailContent = emailTemplates.complaintResolved(
          complainant.username,
          (await SwapRequest.findById(complaint.swapRequestId)).bookId.title,
          `Complaint dismissed: ${reason}`,
          0
        );
        await sendEmail(complainant.email, emailContent.subject, emailContent.text);
      }

      console.log(`Complaint ${complaintId} dismissed by admin ${adminId}`);
      return complaint;
    } catch (error) {
      console.error('Error dismissing complaint:', error);
      throw error;
    }
  }

  // Get complaint statistics (admin only)
  async getComplaintStats() {
    try {
      const stats = await Complaint.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const typeStats = await Complaint.aggregate([
        {
          $group: {
            _id: '$complaintType',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        statusStats: stats,
        typeStats: typeStats,
        totalComplaints: await Complaint.countDocuments()
      };
    } catch (error) {
      console.error('Error getting complaint stats:', error);
      throw error;
    }
  }
}

module.exports = new ComplaintService();
