const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  cover: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who added the book
  status: { type: String, enum: ["available", "swapped"], default: "available" },
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
