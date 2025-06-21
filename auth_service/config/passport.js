const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Try to find user by Google ID
      let user = await User.findOne({ googleId: profile.id });

      // 2. If not found by Google ID, try by email
      if (!user) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email });

        if (user) {
          // If user exists by email, link Google ID and mark as verified
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
        } else {
          // 3. Create new user
          user = await User.create({
            email: email,
            googleId: profile.id,
            isVerified: true
          });
        }
      }

      return done(null, user);
    } catch (err) {
      console.error("Google Auth Error:", err);
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
