const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, required: true },
  swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest", required: true },
  complainantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Owner who raised complaint
  defendantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Borrower being complained about
  complaintType: { type: String, enum: ["overdue", "lost", "damaged", "other"], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["pending", "under_review", "resolved", "dismissed"], default: "pending" },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin handling the case
  resolution: { type: String }, // Admin's decision
  penaltyApplied: { type: Number, default: 0 }, // Any penalties imposed
  trustScoreAdjustment: { type: Number, default: 0 }, // Trust score changes
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
