const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const generateOtp = require("../utils/generateOtp");

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "Email already in use" });

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await sendMail(email, "Verify your email", `Your OTP is: ${otp}`);

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed, otp, otpExpiry });
  await user.save();

  res.json({ msg: "OTP sent to email" });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  // Clear OTP
  user.otp = null;
  user.otpExpiry = null;

  // Generate Tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  await user.save();

  // Return both tokens
  res.status(200).json({
    message: "OTP verified successfully",
    accessToken,
    refreshToken,
  });
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Store refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  res.json({ accessToken, refreshToken });
};

const otpStore = new Map();

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOtp();
  otpStore.set(email, otp);

  await sendMail(email, "Reset Your Password - Aarvasa", `Your OTP is: ${otp}`);
  res.json({ message: "OTP sent to your email" });
};

//To reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const validOtp = otpStore.get(email);
  if (!validOtp || validOtp !== otp)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { password: hashed });

  otpStore.delete(email);
  res.json({ message: "Password updated successfully" });
};

//for those users who initially loggedin with OAuth But now wanted to login normally
exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password) {
      return res.status(400).json({
        message:
          "Password already set. Please log in using email and password.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message:
        "Password set successfully. You can now log in using email and password.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Find user with matching refresh token
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Issue new access token
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Token expired or invalid" });
  }
};
