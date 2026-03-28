const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const { sendEmail, emailTemplates } = require('./emailService');

class TrustScoreService {
  // Calculate trust score for a user based on their history
  async calculateTrustScore(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      let trustScore = 100; // Base score

      // Deductions based on overdue history
      for (const incident of user.overdueHistory) {
        if (incident.daysOverdue >= 1 && incident.daysOverdue <= 3) {
          trustScore -= 2;
        } else if (incident.daysOverdue >= 4 && incident.daysOverdue <= 7) {
          trustScore -= 5;
        } else if (incident.daysOverdue >= 8 && incident.daysOverdue <= 14) {
          trustScore -= 10;
        } else if (incident.daysOverdue >= 15 && incident.daysOverdue <= 30) {
          trustScore -= 15;
        } else if (incident.daysOverdue > 30) {
          trustScore -= 20;
        }
      }

      // Bonus for on-time returns (completed swaps without overdue)
      const completedSwaps = await SwapRequest.countDocuments({
        $or: [{ requesterId: userId }, { ownerId: userId }],
        status: 'accepted',
        archived: true,
        returnAccepted: true,
        overdueStatus: { $ne: 'overdue' }
      });

      trustScore += Math.min(completedSwaps * 1, 20); // Max 20 points bonus

      // Ensure score stays within bounds
      trustScore = Math.max(0, Math.min(100, trustScore));

      return trustScore;
    } catch (error) {
      console.error('Error calculating trust score:', error);
      return 0;
    }
  }

  // Update trust score for a user
  async updateTrustScore(userId) {
    try {
      const calculatedScore = await this.calculateTrustScore(userId);
      const user = await User.findById(userId);

      if (!user) return;

      const oldScore = user.trustScore;
      const scoreDifference = calculatedScore - oldScore;

      await User.findByIdAndUpdate(userId, {
        trustScore: calculatedScore
      });

      // If trust score changed significantly, check for restriction updates
      if (Math.abs(scoreDifference) >= 10) {
        const restrictionService = require('./restrictionService');
        await restrictionService.applyRestrictions(userId);
      }

      console.log(`Updated trust score for user ${userId}: ${oldScore} -> ${calculatedScore}`);
      return calculatedScore;
    } catch (error) {
      console.error('Error updating trust score:', error);
      return 0;
    }
  }

  // Get trust score category
  getTrustScoreCategory(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'very_poor';
  }

  // Award trust score bonus for positive behavior
  async awardTrustScoreBonus(userId, bonusType) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      let bonus = 0;
      switch (bonusType) {
        case 'on_time_return':
          bonus = 1;
          break;
        case 'positive_feedback':
          bonus = 2;
          break;
        case 'complaint_resolved_favorably':
          bonus = 5;
          break;
        default:
          bonus = 0;
      }

      if (bonus > 0) {
        const newScore = Math.min(100, user.trustScore + bonus);
        await User.findByIdAndUpdate(userId, {
          trustScore: newScore
        });

        console.log(`Awarded ${bonus} trust score bonus to user ${userId} for ${bonusType}`);
      }
    } catch (error) {
      console.error('Error awarding trust score bonus:', error);
    }
  }

  // Penalize trust score for negative behavior
  async penalizeTrustScore(userId, penaltyType) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      let penalty = 0;
      switch (penaltyType) {
        case 'late_return':
          penalty = 5;
          break;
        case 'lost_book':
          penalty = 30;
          break;
        case 'complaint_against':
          penalty = 20;
          break;
        case 'severe_violation':
          penalty = 50;
          break;
        default:
          penalty = 0;
      }

      if (penalty > 0) {
        const newScore = Math.max(0, user.trustScore - penalty);
        await User.findByIdAndUpdate(userId, {
          trustScore: newScore
        });

        console.log(`Applied ${penalty} trust score penalty to user ${userId} for ${penaltyType}`);
      }
    } catch (error) {
      console.error('Error penalizing trust score:', error);
    }
  }
}

module.exports = new TrustScoreService();
