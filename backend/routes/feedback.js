const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const SwapRequest = require("../models/SwapRequest");

// Submit feedback
router.post("/submit", async (req, res) => {
  try {
    const { swapRequestId, fromUserId, rating, comment, type } = req.body;

    const swapRequest = await SwapRequest.findById(swapRequestId);
    if (!swapRequest) return res.status(404).json({ message: "Swap request not found" });

    // Determine toUserId based on type and user role
    let toUserId;
    if (type === "book") {
      // Borrower rating the book (to owner)
      if (swapRequest.requesterId.toString() !== fromUserId) {
        return res.status(403).json({ message: "Unauthorized to submit book feedback" });
      }
      toUserId = swapRequest.ownerId;
    } else if (type === "borrower") {
      // Owner rating the borrower
      if (swapRequest.ownerId.toString() !== fromUserId) {
        return res.status(403).json({ message: "Unauthorized to submit borrower feedback" });
      }
      toUserId = swapRequest.requesterId;
    } else {
      return res.status(400).json({ message: "Invalid feedback type" });
    }

    // Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({ swapRequestId, fromUserId, type });
    if (existingFeedback) {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    // Check if within deadline (only if return is accepted)
    if (swapRequest.returnAccepted && (!swapRequest.feedbackDeadline || new Date() > swapRequest.feedbackDeadline)) {
      return res.status(400).json({ message: "Feedback deadline has passed" });
    }

    const newFeedback = new Feedback({
      swapRequestId,
      fromUserId,
      toUserId,
      rating,
      comment,
      type,
    });

    await newFeedback.save();

    // Update submitted flag
    if (type === "book") {
      await SwapRequest.findByIdAndUpdate(swapRequestId, { borrowerFeedbackSubmitted: true });
    } else {
      await SwapRequest.findByIdAndUpdate(swapRequestId, { ownerFeedbackSubmitted: true });
    }

    res.status(201).json(newFeedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get feedbacks for a user (received feedbacks)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const feedbacks = await Feedback.find({ toUserId: userId })
      .populate("swapRequestId")
      .populate("fromUserId", "username")
      .populate("toUserId", "username");

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get feedbacks for a book (book feedbacks)
router.get("/book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    const feedbacks = await Feedback.find({ type: "book" })
      .populate({
        path: "swapRequestId",
        match: { bookId: bookId },
        populate: { path: "bookId", select: "title" }
      })
      .populate("fromUserId", "username")
      .populate("toUserId", "username");

    // Filter out feedbacks where swapRequestId is null (not matching bookId)
    const filteredFeedbacks = feedbacks.filter(f => f.swapRequestId !== null);

    // Calculate average rating
    const totalRating = filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = filteredFeedbacks.length > 0 ? (totalRating / filteredFeedbacks.length).toFixed(1) : 0;

    res.json({ feedbacks: filteredFeedbacks, averageRating: parseFloat(averageRating) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
