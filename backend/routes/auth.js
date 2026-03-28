const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Middleware to get user role from token
const getUserRole = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    // Handle admin case (not in database)
    if (verified.id === 'admin') {
      req.user.role = 'admin';
      return next();
    }
    // Fetch user to get role
    User.findById(verified.id).then(user => {
      if (!user) return res.status(404).json({ message: "User not found" });
      req.user.role = user.role;
      next();
    }).catch(err => {
      res.status(500).json({ message: "Server error" });
    });
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Register
router.post("/register", async (req, res) => {
  const { username, studentId, email, password } = req.body;

  try {
    // Check if user exists by studentId or email
    const existingUserById = await User.findOne({ studentId });
    if (existingUserById) return res.status(400).json({ message: "Student ID already registered" });

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ username, studentId, email, password });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      if (err.keyPattern.email) {
        return res.status(400).json({ message: "Email already registered" });
      } else if (err.keyPattern.studentId) {
        return res.status(400).json({ message: "Student ID already registered" });
      }
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { studentId, password } = req.body;

  try {
    // Pre-decided admin credentials
    if (studentId === 'B000001') {
      if (password !== 'admin123') {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      // Create JWT token for admin
      const token = jwt.sign({ id: 'admin', studentId: 'B000001' }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        user: {
          id: 'admin',
          username: 'Admin',
          studentId: 'B000001',
          email: 'admin@bookswap.com',
          role: 'admin',
        },
      });
    }

    const user = await User.findOne({ studentId: new RegExp(`^${studentId}$`, 'i') });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check if user account is active
    if (user.status !== 'active') return res.status(403).json({ message: "Account is deactivated" });

    // Create JWT token
    const token = jwt.sign({ id: user._id, studentId: user.studentId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set role based on studentId (pre-decided admin)
    const role = user.studentId === 'B000001' ? 'admin' : 'user';

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        studentId: user.studentId,
        email: user.email,
        role: role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { studentId, newPassword } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ studentId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate new password (same rules as login)
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;
    if (!passPattern.test(newPassword)) {
      return res.status(400).json({ message: "Password must start with letter/underscore and include letters, numbers, and a special character." });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router, authenticateToken, getUserRole };
