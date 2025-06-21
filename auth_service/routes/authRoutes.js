const express = require("express");
const passport = require("passport");
const { signup, verifyOtp, login, requestPasswordReset, resetPassword,setPassword,refreshToken } = require("../controllers/authController");
const authLimiter = require('../middlewares/rateLimiter')

const router = express.Router();

router.post("/signup",authLimiter, signup);
router.post("/verify",authLimiter, verifyOtp);
router.post("/login",authLimiter, login);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/set-password',setPassword);
router.post('/refresh-token',refreshToken);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: process.env.FRONTEND_URL + "/signin" }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate access and refresh tokens
      const jwt = require("jsonwebtoken");

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Option 1: Redirect with tokens in query (easy but not super secure)
      res.redirect(`${process.env.FRONTEND_URL}/signin?accessToken=${accessToken}&refreshToken=${refreshToken}`);

      // ✅ Option 2 (Recommended): Send token in cookie (add secure cookie middleware)
      // res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: 'Lax', secure: true });
      // res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'Lax', secure: true });
      // res.redirect(`${process.env.FRONTEND_URL}/signin`);
    } catch (err) {
      console.error("Google auth error:", err);
      res.redirect(process.env.FRONTEND_URL + "/signin?error=google_auth_failed");
    }
  }
);


module.exports = router;
