const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken } = require("./auth");
const trustScoreService = require("../utils/trustScoreService");
const restrictionService = require("../utils/restrictionService");

// GET /profile - Fetch user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get restriction status
    const restrictionStatus = await restrictionService.getRestrictionStatus(user._id);

    res.json({
      id: user._id,
      username: user.username,
      studentId: user.studentId,
      email: user.email,
      createdAt: user.createdAt,
      trustScore: user.trustScore,
      penaltyPoints: user.penaltyPoints,
      accountStatus: user.accountStatus,
      swapLimit: user.swapLimit,
      restrictionStatus: restrictionStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /profile - Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  const { username, email, studentId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if new studentId is already taken by another user
    if (studentId && studentId !== user.studentId) {
      const existingUser = await User.findOne({ studentId });
      if (existingUser) return res.status(400).json({ message: "Student ID already in use" });
      user.studentId = studentId;
    }

    // Update other fields
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        studentId: user.studentId,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      if (err.keyPattern.email) {
        return res.status(400).json({ message: "Email already in use" });
      } else if (err.keyPattern.studentId) {
        return res.status(400).json({ message: "Student ID already in use" });
      }
    }
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /swap-limit/:userId - Update user's swap limit (admin only)
router.put("/swap-limit/:userId", authenticateToken, async (req, res) => {
  const { swapLimit } = req.body;

  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (swapLimit < 0) {
      return res.status(400).json({ message: "Swap limit cannot be negative" });
    }

    user.swapLimit = swapLimit;
    await user.save();

    res.json({
      message: "Swap limit updated successfully",
      user: {
        id: user._id,
        username: user.username,
        swapLimit: user.swapLimit,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /trust-score/:userId - Get user's trust score (admin or self)
router.get("/trust-score/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if requester is admin or requesting their own data
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(userId).select('trustScore penaltyPoints accountStatus overdueHistory');
    if (!user) return res.status(404).json({ message: "User not found" });

    const trustScoreCategory = trustScoreService.getTrustScoreCategory(user.trustScore);

    res.json({
      trustScore: user.trustScore,
      category: trustScoreCategory,
      penaltyPoints: user.penaltyPoints,
      accountStatus: user.accountStatus,
      overdueHistory: user.overdueHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /restricted - Get all restricted/suspended users (admin only)
router.get("/restricted", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const restrictedUsers = await User.find({
      accountStatus: { $in: ['restricted', 'suspended'] }
    }).select('username studentId email trustScore penaltyPoints accountStatus restrictionEndDate swapLimit');

    res.json(restrictedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /update-trust-score/:userId - Update user's trust score (admin only)
router.put("/update-trust-score/:userId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    const { trustScore, reason } = req.body;

    if (trustScore < 0 || trustScore > 100) {
      return res.status(400).json({ message: "Trust score must be between 0 and 100" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldScore = user.trustScore;
    user.trustScore = trustScore;
    await user.save();

    // Apply restrictions based on new trust score
    await restrictionService.applyRestrictions(userId);

    res.json({
      message: "Trust score updated successfully",
      oldScore,
      newScore: trustScore,
      reason
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /clear-restrictions/:userId - Clear user restrictions (admin only)
router.put("/clear-restrictions/:userId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Reset user status
    user.accountStatus = 'active';
    user.restrictionEndDate = null;
    user.swapLimit = 1;
    await user.save();

    res.json({
      message: "User restrictions cleared successfully",
      reason
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
