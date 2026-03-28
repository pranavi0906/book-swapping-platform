// utils/emailService.js
require('dotenv').config(); // Load .env immediately

const nodemailer = require('nodemailer');

// For development/testing, use Ethereal (fake SMTP service)
// In production, switch back to Gmail or your preferred service
// const EMAIL_USER = 'huwmaks5amgjscjt@ethereal.email'; // Ethereal test account user
// const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: EMAIL_USER,
//     pass: 'nMYBY2X84SZhh5w3G8' // Ethereal test account pass
//   }
// });

// To get test credentials, you can run this in Node.js console:
// const nodemailer = require('nodemailer');
// nodemailer.createTestAccount((err, account) => {
//   console.log(account);
// });

// For production, uncomment and configure Gmail:
const EMAIL_USER = process.env.EMAIL_USER?.trim();
const EMAIL_PASS = process.env.EMAIL_PASS?.trim();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Send email function
const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: EMAIL_USER,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  swapRequest: (requesterName, requesterStudentId, bookTitle) => ({
    subject: 'New Swap Request for Your Book',
    text: `You have received a new swap request for your book "${bookTitle}" from ${requesterName} (Student ID: ${requesterStudentId}). Please review it in your BookSwap dashboard.`
  }),

  swapAccepted: (bookTitle, place, time, dueDate) => ({
    subject: 'Your Swap Request Has Been Accepted',
    text: `Your swap request for the book "${bookTitle}" has been accepted.\n\nPlace: ${place}\nTime: ${time}\nDue Date: ${dueDate}`
  }),

  swapRejected: (bookTitle) => ({
    subject: 'Your Swap Request Has Been Rejected',
    text: `Unfortunately, your swap request for the book "${bookTitle}" has been rejected. You can try requesting other available books in your BookSwap dashboard.`
  }),

  returnRequest: (requesterName, bookTitle) => ({
    subject: 'Return Request for Your Book',
    text: `${requesterName} has requested to return the book "${bookTitle}". Please confirm the return in your dashboard.`
  }),

  returnAccepted: (bookTitle) => ({
    subject: 'Return Accepted',
    text: `Your return request for the book "${bookTitle}" has been accepted. Please proceed with returning the book as per the agreed terms.`
  }),

  returnConfirmed: (bookTitle) => ({
    subject: 'Return Confirmed - Thank You!',
    text: `The return for "${bookTitle}" has been confirmed. Thank you for using BookSwap!`
  }),

  dueDateReminder: (userName, bookTitle, dueDate, daysLeft) => {
    const dayText = daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
    return {
      subject: `Reminder: Return Due Date Approaching for "${bookTitle}"`,
      text: `Hi ${userName},\n\nThis is a friendly reminder to return the book "${bookTitle}" by ${dueDate}.\n\nPlease make sure to complete the return ${dayText} through your BookSwap dashboard.\n\nThank you for using BookSwap!`
    };
  },

  bookAvailable: (bookTitle) => ({
    subject: `Your Requested Book "${bookTitle}" is Now Available`,
    text: `Great news! The book "${bookTitle}" you requested is now available for swapping. You can proceed with your swap request in your BookSwap dashboard.`
  }),

  overdueReminder: (userName, bookTitle, daysOverdue, penaltyPoints, reminderType) => {
    const dayText = daysOverdue === 1 ? 'day' : 'days';
    let subject = '';
    let text = '';

    if (reminderType === 'first_overdue') {
      subject = `Overdue Notice: "${bookTitle}" is ${daysOverdue} ${dayText} late`;
      text = `Dear ${userName},\n\nThis is an overdue notice for the book "${bookTitle}" which is ${daysOverdue} ${dayText} past its due date.\n\nPlease return the book as soon as possible to avoid additional penalties. Current penalty points: ${penaltyPoints}\n\nThank you for your cooperation.`;
    } else {
      subject = `Continued Overdue: "${bookTitle}" is ${daysOverdue} ${dayText} late`;
      text = `Dear ${userName},\n\nThis is a continued overdue reminder for the book "${bookTitle}" which is now ${daysOverdue} ${dayText} past its due date.\n\nAccumulated penalty points: ${penaltyPoints}. Please return the book immediately.\n\nFailure to return may result in account restrictions.`;
    }

    return { subject, text };
  },

  overduePenalty: (userName, bookTitle, daysOverdue, additionalPenalty, totalPenalty) => ({
    subject: `Penalty Applied: Additional charges for overdue book "${bookTitle}"`,
    text: `Dear ${userName},\n\nPenalty points have been applied to your account for the overdue book "${bookTitle}".\n\nDays overdue: ${daysOverdue}\nAdditional penalty points: ${additionalPenalty}\nTotal penalty points: ${totalPenalty}\n\nPlease return the book immediately to avoid further penalties and account restrictions.`
  }),

  complaintFiled: (userName, bookTitle, complaintType) => ({
    subject: `Complaint Filed: Issue reported for "${bookTitle}"`,
    text: `Dear ${userName},\n\nA complaint has been filed regarding the book "${bookTitle}" (${complaintType}).\n\nAn administrator will review this matter. You will be notified of the resolution.\n\nPlease check your dashboard for updates.`
  }),

  complaintResolved: (userName, bookTitle, resolution, penaltyApplied) => ({
    subject: `Complaint Resolution: "${bookTitle}" case closed`,
    text: `Dear ${userName},\n\nThe complaint regarding "${bookTitle}" has been resolved.\n\nResolution: ${resolution}\n${penaltyApplied > 0 ? `Penalty applied: ${penaltyApplied} points` : ''}\n\nThank you for your attention to this matter.`
  }),

  accountRestriction: (userName, restrictionType, endDate) => ({
    subject: `Account Status Update: ${restrictionType}`,
    text: `Dear ${userName},\n\nYour account status has been updated to: ${restrictionType}\n\n${endDate ? `Restriction ends: ${new Date(endDate).toLocaleDateString()}` : 'This is a permanent restriction until your trust score improves.'}\n\nPlease review your account status in the dashboard and work to resolve any outstanding issues.`
  }),

  trustScoreUpdate: (userName, newScore, reason) => ({
    subject: 'Trust Score Updated',
    text: `Dear ${userName},\n\nYour trust score has been updated to ${newScore}.\n\nReason: ${reason}\n\nPlease maintain good borrowing habits to keep your trust score high.`
  }),

  bookMarkedAsLost: (userName, bookTitle, penaltyPoints) => ({
    subject: `Book Marked as Lost: "${bookTitle}"`,
    text: `Dear ${userName},\n\nThe book "${bookTitle}" has been marked as lost by the owner.\n\nPenalty points applied: ${penaltyPoints}\n\nPlease contact the owner to resolve this matter. Your account may be restricted if penalties accumulate.`
  }),

  overdueWarning: (userName, bookTitle, daysOverdue, nextPenaltyDate) => ({
    subject: `Urgent: Book "${bookTitle}" is Overdue`,
    text: `Dear ${userName},\n\nThe book "${bookTitle}" is ${daysOverdue} days overdue.\n\nNext penalty will be applied on: ${new Date(nextPenaltyDate).toLocaleDateString()}\n\nPlease return the book immediately to avoid additional penalties and account restrictions.`
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};
