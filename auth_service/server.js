const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");

dotenv.config();
connectDB();

require("./config/passport");

const app = express();
app.set("trust proxy", 1); // trust reverse proxy (Render)

app.use(helmet());

//  CORS setup
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

//  Preflight (OPTIONS) requests handler
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

//  Parse incoming JSON
app.use(express.json());

//  Session setup
app.use(session({
  secret: "otpsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,            //  must be true for HTTPS (Render)
    httpOnly: true,
    sameSite: "none"         //  needed for cross-origin cookies
  }
}));

app.use(passport.initialize());
app.use(passport.session());

//  Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/subscribe", require("./routes/newsletterRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

app.get("/", (req, res) => {
  res.send("ok");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
