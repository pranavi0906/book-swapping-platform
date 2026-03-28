const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },

    // ✅ New field: Wishlist to store added books for each user
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],

    // ✅ New field: Swap limit for active swaps (default 1)
    swapLimit: { type: Number, default: 1 },

    // New fields for overdue handling and trust system
    trustScore: { type: Number, default: 100, min: 0, max: 100 }, // Trust score (100-0 scale)
    penaltyPoints: { type: Number, default: 0, min: 0 }, // Total accumulated penalty points
    accountStatus: { type: String, enum: ['active', 'warning', 'restricted', 'suspended'], default: 'active' },
    restrictionEndDate: { type: Date }, // Date when restrictions lift
    overdueHistory: [{
      swapId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest' },
      date: { type: Date },
      daysOverdue: { type: Number },
      penaltyApplied: { type: Number },
      resolved: { type: Boolean, default: false }
    }],
  },
  { timestamps: true }
);

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
