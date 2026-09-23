import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    validator: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    },
    message: "Invalid email format",
  },

  passwordHash: {
    type: String,
    required: true,
    min: 6,
    max: 15,
  },

  role: {
    type: String,
    default: "customer",
    enum: ["customer", "admin"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
    timestamps: true
});

export default mongoose.model("User", userSchema)
