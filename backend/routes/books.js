const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const mongoose = require("mongoose");
const { authenticateToken } = require("./auth");

// ------------------ Add a new book ------------------
router.post("/add", async (req, res) => {
  try {
    const { title, author, genre, cover, userId } = req.body;
    const newBook = new Book({
      title,
      author,
      genre,
      cover,
      userId,
      status: "available", // default status
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Get all books ------------------
router.get("/", async (req, res) => {
  try {
    const books = await Book.find().populate("userId", "username");
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Get books by user ------------------
router.get("/mybooks/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    // Ensure user can only access their own books
    if (req.user.id !== userId && req.user.id !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    const myBooks = await Book.find({ userId }).populate("userId", "username");
    res.status(200).json(myBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Delete a specific book ------------------
router.delete("/delete/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const deletedBook = await Book.findByIdAndDelete(bookId);
    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Delete all swap requests related to this book
    await require("../models/SwapRequest").deleteMany({ bookId });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Delete all books ------------------
router.delete("/delete-all", async (req, res) => {
  try {
    await Book.deleteMany({});
    // Also delete all swap requests since they reference books
    await require("../models/SwapRequest").deleteMany({});
    res.status(200).json({ message: "All books and related swap requests deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Image proxy to handle CORS ------------------
router.get("/image-proxy", async (req, res) => {
  let imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL required" });
  }

  // Handle data URLs (base64 images)
  if (imageUrl.startsWith("data:")) {
    const [mimeType, base64Data] = imageUrl.split(",");
    const contentType = mimeType.split(":")[1].split(";")[0];
    const buffer = Buffer.from(base64Data, "base64");
    res.set("Content-Type", contentType);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.send(buffer);
    return;
  }

  // Handle local file paths
  if (imageUrl.startsWith("/")) {
    const fs = require("fs");
    const path = require("path");
    let filePath;

    // If it's an absolute path starting with /home/user/bookswapping, use it directly
    if (imageUrl.startsWith("/home/user/bookswapping/")) {
      filePath = imageUrl;
    } else {
      // Otherwise, treat it as relative to project root
      const projectRoot = path.join(__dirname, "../../");
      filePath = path.join(projectRoot, imageUrl);
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
      }[ext] || "application/octet-stream";
      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    } else {
      return res.status(404).json({ message: "Local image not found" });
    }
  }

  // Handle Google imgres URLs
  if (imageUrl.includes("imgres?")) {
    const urlObj = new URL(imageUrl);
    imageUrl = urlObj.searchParams.get("imgurl");
    if (!imageUrl) {
      return res.status(400).json({ message: "Invalid Google imgres URL" });
    }
  }

  try {
    const axios = require("axios");
    const response = await axios.get(imageUrl, {
      responseType: "stream",
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://www.google.com/",
      },
    });
    res.set("Content-Type", response.headers["content-type"]);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    // Return a placeholder image instead of error
    const placeholder = Buffer.from(`
      <svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ddd"/>
        <text x="50%" y="50%" font-size="18" fill="#999" text-anchor="middle" dy=".3em">No Image</text>
      </svg>
    `);
    res.set("Content-Type", "image/svg+xml");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(placeholder);
  }
});

// ------------------ Update a specific book ------------------
router.put("/update/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, genre, cover } = req.body;

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { title, author, genre, cover },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ message: "Book updated successfully", book: updatedBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
