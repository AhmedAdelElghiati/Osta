const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResponse } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const cookieToken = req.cookies?.accessToken;
    const accessToken = token || cookieToken;

    if (!accessToken) {
      return sendResponse(res, 401, false, 'Authentication required');
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    if (!decoded || !decoded.userId || !decoded.role) {
      return sendResponse(res, 401, false, 'Invalid token payload');
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (user?.isBanned) return sendResponse(res, 403, false, 'الحساب محظور بواسطة الإدارة. تواصل مع الدعم.');
    if (!user || !user.isActive) {
      return sendResponse(res, 401, false, 'User account is inactive or not found');
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendResponse(res, 401, false, 'Access token expired');
    }

    return sendResponse(res, 401, false, 'Invalid or expired access token');
  }
};

module.exports = { authenticate };
