const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String,
  otp: String,
  otpExpiry: Date,
  googleId: String,
  refreshToken: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
