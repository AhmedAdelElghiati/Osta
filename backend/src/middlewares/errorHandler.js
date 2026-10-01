const { sendResponse } = require('../utils/apiResponse');

const notFoundHandler = (req, res) => {
  return sendResponse(res, 404, false, 'Resource not found');
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'حجم الصورة لازم يكون 5 ميجابايت أو أقل.'
      : 'ملفات الصور المرفوعة غير صحيحة.';
    return sendResponse(res, 400, false, message);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'حصلت مشكلة غير متوقعة.';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return sendResponse(res, statusCode, false, message);
};

module.exports = { notFoundHandler, errorHandler };
