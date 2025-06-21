const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');

router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: 'You are authorized!', userId: req.user.id });
});

module.exports = router;