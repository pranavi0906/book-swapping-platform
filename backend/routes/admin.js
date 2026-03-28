const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Book = require("../models/Book");
const SwapRequest = require("../models/SwapRequest");
const Feedback = require("../models/Feedback");
const Complaint = require("../models/Complaint");
const { authenticateToken, getUserRole } = require("./auth");
const complaintService = require("../utils/complaintService");

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// Get overview stats
router.get("/stats", getUserRole, requireAdmin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalSwaps = await SwapRequest.countDocuments({ status: 'accepted' });
    const pendingSwaps = await SwapRequest.countDocuments({ status: 'pending' });
    const totalFeedbacks = await Feedback.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const overdueBooks = await SwapRequest.countDocuments({
      status: 'accepted',
      archived: false,
      returnAccepted: false,
      overdueStatus: { $in: ['overdue', 'lost'] }
    });
    const restrictedUsers = await User.countDocuments({
      accountStatus: { $in: ['restricted', 'suspended'] }
    });

    res.json({
      totalBooks,
      totalUsers,
      totalSwaps,
      pendingSwaps,
      totalFeedbacks,
      totalComplaints,
      pendingComplaints,
      overdueBooks,
      restrictedUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users
router.get("/users", getUserRole, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Deactivate/Reactivate user
router.patch("/users/:id/toggle-status", getUserRole, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    res.json({ message: `User status set to ${user.status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user account
router.delete("/users/:id", getUserRole, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Also delete user's books and related swap requests
    await Book.deleteMany({ userId: req.params.id });
    await SwapRequest.deleteMany({ $or: [{ requesterId: req.params.id }, { ownerId: req.params.id }] });
    await Feedback.deleteMany({ $or: [{ fromUserId: req.params.id }, { toUserId: req.params.id }] });

    res.json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all books
router.get("/books", getUserRole, requireAdmin, async (req, res) => {
  try {
    const books = await Book.find().populate("userId", "username").sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove book
router.delete("/books/:id", getUserRole, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Delete all swap requests related to this book
    await SwapRequest.deleteMany({ bookId: req.params.id });

    res.json({ message: "Book removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all swap requests
router.get("/swaps", getUserRole, requireAdmin, async (req, res) => {
  try {
    const swaps = await SwapRequest.find()
      .populate("requesterId", "username")
      .populate("ownerId", "username")
      .populate("bookId", "title")
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel swap
router.patch("/swaps/:id/cancel", getUserRole, requireAdmin, async (req, res) => {
  try {
    const swap = await SwapRequest.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    if (!swap) return res.status(404).json({ message: "Swap not found" });
    res.json({ message: "Swap cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all feedbacks
router.get("/feedbacks", getUserRole, requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("fromUserId", "username")
      .populate("toUserId", "username")
      .populate({
        path: "swapRequestId",
        populate: {
          path: "bookId",
          select: "title"
        }
      })
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete feedback
router.delete("/feedbacks/:id", getUserRole, requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json({ message: "Feedback deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all complaints (admin only)
router.get("/complaints", getUserRole, requireAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('swapRequestId')
      .populate('complainantId', 'username email')
      .populate('defendantId', 'username email')
      .populate('adminId', 'username')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get complaint statistics
router.get("/complaints/stats", getUserRole, requireAdmin, async (req, res) => {
  try {
    const stats = await complaintService.getComplaintStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
