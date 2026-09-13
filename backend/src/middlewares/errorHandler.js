const { sendResponse } = require('../utils/apiResponse');

const notFoundHandler = (req, res) => {
  return sendResponse(res, 404, false, 'Resource not found');
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return sendResponse(res, statusCode, false, message);
};

module.exports = { notFoundHandler, errorHandler };
