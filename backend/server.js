const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import services
const reminderService = require("./utils/reminderService");
const overdueDetectionService = require("./utils/overdueDetectionService");

const app = express();

// Middleware: CORS properly configure cheyyi
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"], // React frontend URLs (Vite running on various ports)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// Routes
const { router: authRoutes } = require("./routes/auth");
app.use("/api/auth", authRoutes);
const wishlistRoutes = require("./routes/wishlistRoutes");
app.use("/api/wishlist", wishlistRoutes);

app.get("/", (req, res) => {
  res.send("BookSwap Backend is running!");
});
const booksRoute = require("./routes/books");
app.use("/api/books", booksRoute);

const swapRequestRoutes = require("./routes/swapRequests");
app.use("/api/swapRequests", swapRequestRoutes);

const feedbackRoutes = require("./routes/feedback");
app.use("/api/feedback", feedbackRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contact", contactRoutes);

const complaintRoutes = require("./routes/complaintRoutes");
app.use("/api/complaints", complaintRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("MongoDB connected ✅");
  // Start services after DB connection
  reminderService.start();
  overdueDetectionService.start();
})
.catch((err) => console.log("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
