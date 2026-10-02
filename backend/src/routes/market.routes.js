const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const marketController = require('../controllers/market.controller');

const router = express.Router();

const optionalAuthenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const accessToken = token || req.cookies?.accessToken;
    if (!accessToken) return next();

    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    if (!decoded?.userId || !decoded?.role) return next();

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) return next();

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
  } catch (_) {
    // Keep the market public; signed-in artisans get personalized offer state.
  }
  next();
};

router.get('/', optionalAuthenticate, marketController.list);
router.get('/stats', marketController.stats);

module.exports = router;
