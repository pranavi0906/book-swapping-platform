const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Add book to wishlist
router.post("/add", async (req, res) => {
  const { userId, bookId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate books
    const alreadyExists = user.wishlist.some((b) => b.toString() === bookId);
    if (alreadyExists)
      return res.status(200).json({ message: "Book already in wishlist" });

    user.wishlist.push(bookId);
    await user.save();

    res.status(200).json({ message: "Book added to wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user wishlist
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Remove from wishlist
router.delete("/remove", async (req, res) => {
  const { userId, bookId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.wishlist = user.wishlist.filter((b) => b.toString() !== bookId);
    await user.save();

    res.status(200).json({ message: "Book removed from wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
