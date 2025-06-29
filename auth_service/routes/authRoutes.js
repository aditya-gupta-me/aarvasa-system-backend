const express = require("express");
const passport = require("passport");
const {
  signup,
  verifyOtp,
  login,
  requestPasswordReset,
  resetPassword,
  setPassword,
  refreshToken,
  googleAuthCallback,
  getCurrentUser
} = require("../controllers/authController");
const authLimiter = require("../middlewares/rateLimiter");
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Auth Routes
router.post("/signup", authLimiter, signup);
router.post("/verify", authLimiter, verifyOtp);
router.post("/login", authLimiter, login);
router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/set-password", setPassword);
router.post("/refresh-token", refreshToken);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.FRONTEND_URL + "/signup",
  }),
  googleAuthCallback
);

router.get('/me', verifyToken, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    picture: req.user.picture,
    googleId: req.user.googleId,
    locale: req.user.locale
  });
});

module.exports = router;
