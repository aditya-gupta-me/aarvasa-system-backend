const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://auth-service-lbp1.onrender.com/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    // 👇 Add this fallback to avoid duplicate email insert
    if (!user) {
      // Try finding by email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // If user exists, link googleId
        user.googleId = profile.id;
        await user.save();
      } else {
        // If not exists, create new user
        user = await User.create({
          email: profile.emails[0].value,
          googleId: profile.id
        });
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));


passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => done(null, await User.findById(id)));
