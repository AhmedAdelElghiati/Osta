const { sendResponse } = require('../utils/apiResponse');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'You are not authorized to access this resource');
    }

    next();
  };
};

module.exports = { authorize };
