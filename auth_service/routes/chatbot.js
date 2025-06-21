// routes/chatbot.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await axios.post("http://localhost:8000/chat", {
      message,
      history,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to connect to chatbot", details: err.message });
  }
});

module.exports = router;
