const cron = require('node-cron');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('./emailService');

class ReminderService {
  constructor() {
    this.isRunning = false;
  }

  // Start the reminder service
  start() {
    if (this.isRunning) {
      console.log('Reminder service is already running');
      return;
    }

    console.log('Starting reminder service...');

    // Run daily at 5:00 AM
    cron.schedule('0 5 * * *', async () => {
      console.log('Running daily reminder check...');
      await this.checkAndSendReminders();
    });

    this.isRunning = true;
    console.log('Reminder service started successfully');

    // Run initial check on startup (for testing)
    setTimeout(() => {
      console.log('Running initial reminder check on startup...');
      this.checkAndSendReminders();
    }, 5000); // 5 seconds after startup
  }

  // Main function to check and send reminders
  async checkAndSendReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate dates for reminders
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      const oneDayFromNow = new Date(today);
      oneDayFromNow.setDate(today.getDate() + 1);

      console.log(`Checking reminders for dates: Today: ${today.toDateString()}, 1 day: ${oneDayFromNow.toDateString()}, 3 days: ${threeDaysFromNow.toDateString()}`);

      // Find active swaps that need reminders (exclude overdue ones as they're handled by OverdueDetectionService)
      const swapsNeedingReminders = await SwapRequest.find({
        status: 'accepted',
        archived: false,
        returnAccepted: false,
        dueDate: { $exists: true },
        overdueStatus: { $ne: 'overdue' } // Don't send pre-due reminders for already overdue books
      }).populate('requesterId').populate('bookId');

      console.log(`Found ${swapsNeedingReminders.length} active swaps to check for pre-due reminders`);

      let remindersSent = 0;

      for (const swap of swapsNeedingReminders) {
        const dueDate = new Date(swap.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Check for 3-day reminder
        if (daysUntilDue === 3 && !swap.reminder3DaysSent) {
          await this.sendReminder(swap, 3);
          await SwapRequest.findByIdAndUpdate(swap._id, { reminder3DaysSent: true });
          remindersSent++;
        }

        // Check for 1-day reminder
        else if (daysUntilDue === 1 && !swap.reminder1DaySent) {
          await this.sendReminder(swap, 1);
          await SwapRequest.findByIdAndUpdate(swap._id, { reminder1DaySent: true });
          remindersSent++;
        }

        // Check for due date reminder
        else if (daysUntilDue === 0 && !swap.reminderDueSent) {
          await this.sendReminder(swap, 0);
          await SwapRequest.findByIdAndUpdate(swap._id, { reminderDueSent: true });
          remindersSent++;
        }
      }

      console.log(`Pre-due reminder check completed. Sent ${remindersSent} reminders.`);

    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  }

  // Send individual reminder
  async sendReminder(swap, daysLeft) {
    try {
      const borrower = swap.requesterId;
      const book = swap.bookId;

      if (!borrower || !borrower.email || !book) {
        console.log(`Skipping reminder for swap ${swap._id}: Missing borrower email or book data`);
        return;
      }

      const dueDateFormatted = new Date(swap.dueDate).toLocaleDateString();
      const emailContent = emailTemplates.dueDateReminder(
        borrower.username,
        book.title,
        dueDateFormatted,
        daysLeft
      );

      const result = await sendEmail(borrower.email, emailContent.subject, emailContent.text);

      if (result.success) {
        console.log(`Reminder sent to ${borrower.email} for book "${book.title}" (${daysLeft} days left)`);
      } else {
        console.error(`Failed to send reminder to ${borrower.email}:`, result.error);
      }

    } catch (error) {
      console.error(`Error sending reminder for swap ${swap._id}:`, error);
    }
  }

  // Manual trigger for testing (can be called via API endpoint)
  async triggerManualCheck() {
    console.log('Manual reminder check triggered...');
    await this.checkAndSendReminders();
    return { message: 'Manual reminder check completed' };
  }
}

module.exports = new ReminderService();
