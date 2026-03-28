const cron = require('node-cron');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('./emailService');

class OverdueDetectionService {
  constructor() {
    this.isRunning = false;
  }

  // Start the overdue detection service
  start() {
    if (this.isRunning) {
      console.log('Overdue detection service is already running');
      return;
    }

    console.log('Starting overdue detection service...');

    // Run daily at 12:00 AM (midnight)
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily overdue detection...');
      await this.detectAndHandleOverdueBooks();
    });

    this.isRunning = true;
    console.log('Overdue detection service started successfully');

    // Run initial check on startup (for testing)
    setTimeout(() => {
      console.log('Running initial overdue detection on startup...');
      this.detectAndHandleOverdueBooks();
    }, 10000); // 10 seconds after startup
  }

  // Main function to detect and handle overdue books
  async detectAndHandleOverdueBooks() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log(`Checking for overdue books as of ${today.toDateString()}`);

      // Find all accepted swaps that are past due date and not marked as lost
      const overdueSwaps = await SwapRequest.find({
        status: 'accepted',
        archived: false,
        returnAccepted: false,
        dueDate: { $exists: true, $lt: today },
        overdueStatus: { $ne: 'lost' }
      }).populate('requesterId').populate('bookId').populate('ownerId');

      console.log(`Found ${overdueSwaps.length} potentially overdue swaps`);

      let newlyOverdue = 0;
      let penaltyApplied = 0;

      for (const swap of overdueSwaps) {
        const daysOverdue = Math.floor((today - new Date(swap.dueDate)) / (1000 * 60 * 60 * 24));

        // Mark as overdue if not already
        if (swap.overdueStatus !== 'overdue') {
          await SwapRequest.findByIdAndUpdate(swap._id, {
            overdueStatus: 'overdue',
            overdueDate: today
          });
          newlyOverdue++;
          console.log(`Marked swap ${swap._id} as overdue (${daysOverdue} days)`);
        }

        // Calculate and apply penalties
        const penaltyAppliedForSwap = await this.calculateAndApplyPenalties(swap, daysOverdue);
        if (penaltyAppliedForSwap > 0) {
          penaltyApplied++;
        }

        // Send overdue reminders
        await this.sendOverdueReminders(swap, daysOverdue);
      }

      console.log(`Overdue detection completed. Newly overdue: ${newlyOverdue}, Penalties applied: ${penaltyApplied}`);

    } catch (error) {
      console.error('Error in overdue detection service:', error);
    }
  }

  // Calculate and apply penalties based on days overdue
  async calculateAndApplyPenalties(swap, daysOverdue) {
    try {
      const borrower = swap.requesterId;
      if (!borrower) return 0;

      let penaltyPoints = 0;

      // Penalty calculation based on days overdue
      if (daysOverdue >= 1 && daysOverdue <= 3) {
        penaltyPoints = 0; // Warning only
      } else if (daysOverdue >= 4 && daysOverdue <= 7) {
        penaltyPoints = 1;
      } else if (daysOverdue >= 8 && daysOverdue <= 14) {
        penaltyPoints = 2;
      } else if (daysOverdue >= 15) {
        penaltyPoints = Math.floor((daysOverdue - 14) / 7) * 3; // 3 points per week after 2 weeks
      }

      // Only apply if penalty points have increased
      if (penaltyPoints > swap.penaltyPoints) {
        const additionalPenalty = penaltyPoints - swap.penaltyPoints;

        // Update swap penalty points
        await SwapRequest.findByIdAndUpdate(swap._id, {
          penaltyPoints: penaltyPoints
        });

        // Update user penalty points and trust score
        const trustScoreDeduction = this.calculateTrustScoreDeduction(daysOverdue);
        await User.findByIdAndUpdate(borrower._id, {
          $inc: {
            penaltyPoints: additionalPenalty,
            trustScore: -trustScoreDeduction
          },
          $push: {
            overdueHistory: {
              swapId: swap._id,
              date: new Date(),
              daysOverdue: daysOverdue,
              penaltyApplied: additionalPenalty,
              resolved: false
            }
          }
        });

        // Apply account restrictions if needed
        const restrictionService = require('./restrictionService');
        await restrictionService.applyRestrictions(borrower._id);

        // Send penalty notification
        if (borrower.email) {
          const emailContent = emailTemplates.overduePenalty(
            borrower.username,
            swap.bookId.title,
            daysOverdue,
            additionalPenalty,
            penaltyPoints
          );
          await sendEmail(borrower.email, emailContent.subject, emailContent.text);
        }

        console.log(`Applied ${additionalPenalty} penalty points to user ${borrower._id} for swap ${swap._id}`);
        return additionalPenalty;
      }

      return 0;
    } catch (error) {
      console.error(`Error calculating penalties for swap ${swap._id}:`, error);
      return 0;
    }
  }

  // Calculate trust score deduction based on days overdue
  calculateTrustScoreDeduction(daysOverdue) {
    if (daysOverdue >= 1 && daysOverdue <= 3) return 2;
    if (daysOverdue >= 4 && daysOverdue <= 7) return 5;
    if (daysOverdue >= 8 && daysOverdue <= 14) return 10;
    if (daysOverdue >= 15 && daysOverdue <= 30) return 15;
    return 20; // Max deduction for very overdue books
  }

  // Note: applyAccountRestrictions method removed - now using RestrictionService

  // Send overdue reminders
  async sendOverdueReminders(swap, daysOverdue) {
    try {
      const borrower = swap.requesterId;
      if (!borrower || !borrower.email) return;

      const lastReminder = swap.lastReminderSent ? new Date(swap.lastReminderSent) : null;
      const now = new Date();

      let shouldSendReminder = false;
      let reminderType = '';

      // Send reminder 1 day after due date
      if (daysOverdue === 1 && (!lastReminder || (now - lastReminder) >= (24 * 60 * 60 * 1000))) {
        shouldSendReminder = true;
        reminderType = 'first_overdue';
      }
      // Send reminder every 3 days after that
      else if (daysOverdue > 1 && (!lastReminder || (now - lastReminder) >= (3 * 24 * 60 * 60 * 1000))) {
        shouldSendReminder = true;
        reminderType = 'continued_overdue';
      }

      if (shouldSendReminder) {
        const emailContent = emailTemplates.overdueReminder(
          borrower.username,
          swap.bookId.title,
          daysOverdue,
          swap.penaltyPoints,
          reminderType
        );

        const result = await sendEmail(borrower.email, emailContent.subject, emailContent.text);

        if (result.success) {
          await SwapRequest.findByIdAndUpdate(swap._id, {
            lastReminderSent: now
          });
          console.log(`Overdue reminder sent to ${borrower.email} for book "${swap.bookId.title}" (${daysOverdue} days overdue)`);
        } else {
          console.error(`Failed to send overdue reminder to ${borrower.email}:`, result.error);
        }
      }
    } catch (error) {
      console.error(`Error sending overdue reminder for swap ${swap._id}:`, error);
    }
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manual overdue detection triggered...');
    await this.detectAndHandleOverdueBooks();
    return { message: 'Manual overdue detection completed' };
  }
}

module.exports = new OverdueDetectionService();
