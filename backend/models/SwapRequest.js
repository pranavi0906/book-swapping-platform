const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  dueDate: { type: Date },
  place: { type: String }, // Meeting location for accepted swaps
  time: { type: String }, // Meeting time for accepted swaps
  returnRequested: { type: Boolean, default: false },
  returnAccepted: { type: Boolean, default: false },
  feedbackDeadline: { type: Date },
  borrowerFeedbackSubmitted: { type: Boolean, default: false },
  ownerFeedbackSubmitted: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  completedAt: { type: Date },
  reminder3DaysSent: { type: Boolean, default: false },
  reminder1DaySent: { type: Boolean, default: false },
  reminderDueSent: { type: Boolean, default: false },

  // New fields for overdue handling
  overdueStatus: { type: String, enum: ["active", "overdue", "lost"], default: "active" },
  overdueDate: { type: Date }, // Date when book became overdue
  penaltyPoints: { type: Number, default: 0 }, // Penalty points for this swap
  lastReminderSent: { type: Date }, // Date of last automated reminder
  markedAsLostDate: { type: Date }, // Date when owner marked as lost
}, { timestamps: true });

module.exports = mongoose.model("SwapRequest", swapRequestSchema);
