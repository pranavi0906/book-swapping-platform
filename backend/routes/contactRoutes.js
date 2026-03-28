const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");

// Submit contact form
router.post("/submit", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Admin email - you can set this in .env as ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL || "admin@bookswap.com";

    const subject = `Contact Us Message from ${name}`;
    const text = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

    const result = await sendEmail(adminEmail, subject, text);

    if (result.success) {
      res.status(200).json({ message: "Message sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send message" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
