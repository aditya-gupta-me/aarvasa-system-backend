const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  refreshToken: String,

  // New fields
  name: String,
  photo: String,

  otp: String,
  otpExpiry: Date,
});

module.exports = mongoose.model("User", userSchema);
