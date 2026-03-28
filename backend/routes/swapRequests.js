const express = require("express");
const router = express.Router();
const SwapRequest = require("../models/SwapRequest");
const Book = require("../models/Book");
const User = require("../models/User");
const { sendEmail, emailTemplates } = require("../utils/emailService");

// Create a new swap request
router.post("/add", async (req, res) => {
  try {
    const { requesterId, bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.userId.toString() === requesterId)
      return res.status(400).json({ message: "Cannot request your own book" });

    const existing = await SwapRequest.findOne({ requesterId, bookId, status: "pending" });
    if (existing)
      return res.status(400).json({ message: "Swap already requested" });

    // Check if user has any unreturned books
    const unreturnedSwaps = await SwapRequest.countDocuments({
      requesterId,
      status: "accepted",
      returnAccepted: false
    });

    if (unreturnedSwaps > 0) {
      return res.status(400).json({
        message: "Return the previous book"
      });
    }

    // Check user restrictions and permissions
    const restrictionService = require("../utils/restrictionService");
    const swapPermission = await restrictionService.canCreateSwapRequest(requesterId);

    if (!swapPermission.allowed) {
      return res.status(400).json({
        message: swapPermission.reason
      });
    }

    const user = await User.findById(requesterId);
    if (!user) return res.status(404).json({ message: "User not found" });



    const newRequest = new SwapRequest({
      bookId,
      requesterId,
      ownerId: book.userId,
    });

    await newRequest.save();

    // Send email to book owner
    const owner = await User.findById(book.userId);
    const requester = await User.findById(requesterId);
    if (owner && owner.email && requester) {
      const emailContent = emailTemplates.swapRequest(requester.username, requester.studentId, book.title);
      await sendEmail(owner.email, emailContent.subject, emailContent.text);
    }

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all swap requests related to a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // 'active' or 'history'

    let filter = {
      $or: [{ requesterId: userId }, { ownerId: userId }],
    };

    if (type === 'active') {
      filter.archived = false;
    } else if (type === 'history') {
      filter.archived = true;
    }

    const requests = await SwapRequest.find(filter)
      .populate("bookId")
      .populate("requesterId", "username studentId email")
      .populate("ownerId", "username studentId email")
      .sort({ completedAt: -1, updatedAt: -1 });

    // Filter out requests where bookId is null (book was deleted)
    const filteredRequests = requests.filter(req => req.bookId !== null);

    res.json(filteredRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update status (accept or reject)
router.put("/update/:id", async (req, res) => {
  try {
    const { status, place, time, dueDate } = req.body;
    const { id } = req.params;

    const updateData = { status };
    if (status === "accepted" && place && time && dueDate) {
      updateData.place = place;
      updateData.time = time;
      updateData.dueDate = new Date(dueDate);
    }

    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("bookId").populate("requesterId");

    if (status === "accepted") {
      // Update book status to swapped
      await Book.findByIdAndUpdate(updatedRequest.bookId._id, { status: "swapped" });

      // Send email to requester
      if (updatedRequest.requesterId && updatedRequest.requesterId.email) {
        const emailContent = emailTemplates.swapAccepted(
          updatedRequest.bookId.title,
          place,
          time,
          dueDate
        );
        await sendEmail(updatedRequest.requesterId.email, emailContent.subject, emailContent.text);
      }
    }

    // Update all other pending requests for this book to rejected
    if (status === "accepted") {
      const rejectedRequests = await SwapRequest.find({
        bookId: updatedRequest.bookId._id,
        status: "pending",
        _id: { $ne: id }
      }).populate("requesterId");

      await SwapRequest.updateMany(
        { bookId: updatedRequest.bookId._id, status: "pending", _id: { $ne: id } },
        {
          status: "rejected",
          archived: true,
          completedAt: new Date()
        }
      );

      // Send rejection emails to other requesters
      for (const req of rejectedRequests) {
        if (req.requesterId && req.requesterId.email) {
          const emailContent = emailTemplates.swapRejected(updatedRequest.bookId.title);
          await sendEmail(req.requesterId.email, emailContent.subject, emailContent.text);
        }
      }
    }

    // Archive rejected requests immediately
    if (status === "rejected") {
      await SwapRequest.findByIdAndUpdate(id, {
        archived: true,
        completedAt: new Date()
      });
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request to return a swapped book
router.put("/return/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      id,
      { returnRequested: true },
      { new: true }
    ).populate("bookId").populate("ownerId").populate("requesterId");

    if (!updatedRequest) {
      return res.status(404).json({ message: "Swap request not found" });
    }

    // Send email to book owner
    if (updatedRequest.ownerId && updatedRequest.ownerId.email) {
      const emailContent = emailTemplates.returnRequest(
        updatedRequest.requesterId.username,
        updatedRequest.bookId.title
      );
      await sendEmail(updatedRequest.ownerId.email, emailContent.subject, emailContent.text);
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept return request
router.put("/accept-return/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      id,
      { returnAccepted: true },
      { new: true }
    ).populate("bookId").populate("requesterId");

    if (!updatedRequest) {
      return res.status(404).json({ message: "Swap request not found" });
    }

    // Send email to requester that return is accepted
    if (updatedRequest.requesterId && updatedRequest.requesterId.email) {
      const emailContent = emailTemplates.returnAccepted(updatedRequest.bookId.title);
      await sendEmail(updatedRequest.requesterId.email, emailContent.subject, emailContent.text);
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Complete return process
router.put("/complete-return/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const feedbackDeadline = new Date();
    feedbackDeadline.setDate(feedbackDeadline.getDate() + 7); // 7 days from now

    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      id,
      {
        returnAccepted: true,
        feedbackDeadline,
        archived: true,
        completedAt: new Date()
      },
      { new: true }
    ).populate("bookId").populate("requesterId");

    if (!updatedRequest) {
      return res.status(404).json({ message: "Swap request not found" });
    }

    // Update book status to available
    await Book.findByIdAndUpdate(updatedRequest.bookId._id, { status: "available" });

    // Send thank you email to requester (optional)
    if (updatedRequest.requesterId && updatedRequest.requesterId.email) {
      const emailContent = emailTemplates.returnConfirmed(updatedRequest.bookId.title);
      await sendEmail(updatedRequest.requesterId.email, emailContent.subject, emailContent.text);
    }

    // Notify all users who have pending requests for this book that it's now available
    const pendingRequests = await SwapRequest.find({
      bookId: updatedRequest.bookId._id,
      status: "pending"
    }).populate("requesterId");

    for (const pendingReq of pendingRequests) {
      if (pendingReq.requesterId && pendingReq.requesterId.email) {
        const emailContent = emailTemplates.bookAvailable(updatedRequest.bookId.title);
        await sendEmail(pendingReq.requesterId.email, emailContent.subject, emailContent.text);
      }
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Set due date for accepted swap request
router.put("/set-due-date/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body;

    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      id,
      { dueDate: new Date(dueDate) },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Swap request not found" });
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's active swap count and limit
router.get("/active-count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const activeSwaps = await SwapRequest.countDocuments({
      requesterId: userId,
      status: "accepted",
      returnAccepted: false,
      archived: false
    });

    res.json({
      activeSwaps,
      swapLimit: user.swapLimit
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear user's swap history
router.delete("/clear-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await SwapRequest.deleteMany({
      $or: [{ requesterId: userId }, { ownerId: userId }],
      archived: true
    });

    res.json({
      message: `Deleted ${result.deletedCount} archived swap requests from history`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manual trigger for reminder service (for testing)
router.post("/trigger-reminders", async (req, res) => {
  try {
    const reminderService = require("../utils/reminderService");
    const result = await reminderService.triggerManualCheck();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manual trigger for overdue detection service (for testing)
router.post("/trigger-overdue-check", async (req, res) => {
  try {
    const overdueDetectionService = require("../utils/overdueDetectionService");
    const result = await overdueDetectionService.triggerManualCheck();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark swap as overdue (admin/owner action)
router.put("/:id/mark-overdue", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // User performing the action

    const swap = await SwapRequest.findById(id).populate('ownerId');
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    // Only owner or admin can mark as overdue
    if (swap.ownerId._id.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized to mark as overdue" });
    }

    const updatedSwap = await SwapRequest.findByIdAndUpdate(
      id,
      {
        overdueStatus: 'overdue',
        overdueDate: new Date()
      },
      { new: true }
    );

    res.json(updatedSwap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark book as lost (admin/owner action)
router.put("/:id/mark-lost", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // User performing the action

    const swap = await SwapRequest.findById(id).populate('ownerId').populate('requesterId');
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    // Only owner or admin can mark as lost
    if (swap.ownerId._id.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized to mark as lost" });
    }

    // Apply lost book penalty (10 points + trust score reduction)
    await User.findByIdAndUpdate(swap.requesterId._id, {
      $inc: {
        penaltyPoints: 10,
        trustScore: -30
      },
      $push: {
        overdueHistory: {
          swapId: swap._id,
          date: new Date(),
          daysOverdue: Math.floor((new Date() - new Date(swap.dueDate)) / (1000 * 60 * 60 * 24)),
          penaltyApplied: 10,
          resolved: true
        }
      }
    });

    const updatedSwap = await SwapRequest.findByIdAndUpdate(
      id,
      {
        overdueStatus: 'lost',
        markedAsLostDate: new Date(),
        penaltyPoints: (swap.penaltyPoints || 0) + 10
      },
      { new: true }
    );

    // Send notification to borrower
    if (swap.requesterId.email) {
      const emailContent = emailTemplates.overduePenalty(
        swap.requesterId.username,
        swap.bookId.title,
        Math.floor((new Date() - new Date(swap.dueDate)) / (1000 * 60 * 60 * 24)),
        10,
        (swap.penaltyPoints || 0) + 10
      );
      await sendEmail(swap.requesterId.email, emailContent.subject, emailContent.text);
    }

    res.json(updatedSwap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
