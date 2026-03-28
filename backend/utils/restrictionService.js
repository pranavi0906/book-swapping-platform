const User = require('../models/User');
const { sendEmail, emailTemplates } = require('./emailService');

class RestrictionService {
  // Apply restrictions based on user's current status
  async applyRestrictions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      let newStatus = 'active';
      let restrictionEndDate = null;
      let swapLimit = 1; // Default

      // Check if user has active overdue books
      const activeOverdueSwaps = await require('../models/SwapRequest').countDocuments({
        requesterId: userId,
        status: 'accepted',
        archived: false,
        returnAccepted: false,
        overdueStatus: { $in: ['overdue', 'lost'] }
      });

      // If user has overdue books, restrict new swaps
      if (activeOverdueSwaps > 0) {
        newStatus = 'restricted';
        swapLimit = 0; // Cannot create new swap requests until resolved
      } else {
        // Apply restrictions based on penalty points (3-strike rule)
        if (user.penaltyPoints >= 30) {
          newStatus = 'suspended';
          swapLimit = 0;
        } else if (user.penaltyPoints >= 15) {
          newStatus = 'restricted';
          restrictionEndDate = new Date();
          restrictionEndDate.setDate(restrictionEndDate.getDate() + 14); // 14 days
          swapLimit = 1;
        } else if (user.penaltyPoints >= 5) {
          newStatus = 'warning';
          restrictionEndDate = new Date();
          restrictionEndDate.setDate(restrictionEndDate.getDate() + 7); // 7 days
          swapLimit = 2;
        }

        // Trust score based restrictions (override penalty-based restrictions if more severe)
        if (user.trustScore <= 29) {
          newStatus = 'suspended';
          swapLimit = 0;
          restrictionEndDate = null; // Permanent until score improves
        } else if (user.trustScore <= 49) {
          newStatus = 'restricted';
          swapLimit = 1;
        } else if (user.trustScore <= 69) {
          swapLimit = 2;
        }
      }

      // Check if status actually changed
      const statusChanged = user.accountStatus !== newStatus;
      const limitChanged = user.swapLimit !== swapLimit;

      if (statusChanged || limitChanged) {
        await User.findByIdAndUpdate(userId, {
          accountStatus: newStatus,
          restrictionEndDate: restrictionEndDate,
          swapLimit: swapLimit
        });

        // Send notification if status changed to restricted or suspended
        if (statusChanged && (newStatus === 'restricted' || newStatus === 'suspended') && user.email) {
          const emailContent = emailTemplates.accountRestriction(
            user.username,
            newStatus,
            restrictionEndDate
          );
          await sendEmail(user.email, emailContent.subject, emailContent.text);
        }

        console.log(`Applied restrictions to user ${userId}: status=${newStatus}, limit=${swapLimit}`);
      }

      return { status: newStatus, swapLimit, restrictionEndDate };
    } catch (error) {
      console.error('Error applying restrictions:', error);
      return null;
    }
  }

  // Check if user can create new swap requests
  async canCreateSwapRequest(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { allowed: false, reason: 'User not found' };

      // Check account status
      if (user.accountStatus === 'suspended') {
        return { allowed: false, reason: 'Account is suspended' };
      }

      // Check restriction end date
      if (user.restrictionEndDate && new Date() < new Date(user.restrictionEndDate)) {
        return { allowed: false, reason: `Account restricted until ${user.restrictionEndDate.toDateString()}` };
      }

      // Check active overdue swaps
      const activeOverdueSwaps = await require('../models/SwapRequest').countDocuments({
        requesterId: userId,
        status: 'accepted',
        archived: false,
        returnAccepted: false,
        overdueStatus: { $in: ['overdue', 'lost'] }
      });

      if (activeOverdueSwaps > 0) {
        return { allowed: false, reason: 'Cannot create new swaps while having overdue books' };
      }

      // Check current active swaps against limit
      const activeSwaps = await require('../models/SwapRequest').countDocuments({
        requesterId: userId,
        status: 'accepted',
        archived: false,
        returnAccepted: false
      });

      if (activeSwaps >= user.swapLimit) {
        return { allowed: false, reason: `Swap limit reached (${user.swapLimit})` };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking swap request permission:', error);
      return { allowed: false, reason: 'System error' };
    }
  }

  // Lift expired restrictions
  async liftExpiredRestrictions() {
    try {
      const now = new Date();

      // Find users with expired restrictions
      const usersWithExpiredRestrictions = await User.find({
        accountStatus: { $in: ['warning', 'restricted'] },
        restrictionEndDate: { $exists: true, $lt: now }
      });

      let liftedCount = 0;

      for (const user of usersWithExpiredRestrictions) {
        // Reset to active status and default swap limit
        await User.findByIdAndUpdate(user._id, {
          accountStatus: 'active',
          swapLimit: 1,
          restrictionEndDate: null
        });

        // Send notification
        if (user.email) {
          const emailContent = emailTemplates.accountRestriction(
            user.username,
            'active',
            null
          );
          await sendEmail(user.email, 'Account Restrictions Lifted', emailContent.text.replace('Account Status Update: active', 'Account Restrictions Lifted'));
        }

        liftedCount++;
        console.log(`Lifted restrictions for user ${user._id}`);
      }

      console.log(`Lifted restrictions for ${liftedCount} users`);
      return liftedCount;
    } catch (error) {
      console.error('Error lifting expired restrictions:', error);
      return 0;
    }
  }

  // Get user's restriction status
  async getRestrictionStatus(userId) {
    try {
      const user = await User.findById(userId).select('accountStatus swapLimit restrictionEndDate trustScore penaltyPoints');
      if (!user) return null;

      const canCreateSwap = await this.canCreateSwapRequest(userId);

      return {
        accountStatus: user.accountStatus,
        swapLimit: user.swapLimit,
        restrictionEndDate: user.restrictionEndDate,
        trustScore: user.trustScore,
        penaltyPoints: user.penaltyPoints,
        canCreateSwap: canCreateSwap.allowed,
        restrictionReason: canCreateSwap.allowed ? null : canCreateSwap.reason
      };
    } catch (error) {
      console.error('Error getting restriction status:', error);
      return null;
    }
  }
}

module.exports = new RestrictionService();
