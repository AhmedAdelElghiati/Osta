const { sendResponse } = require('../utils/apiResponse');
const Notification = require('../models/Notification');

// GET /api/v1/notifications
const listMine = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return sendResponse(res, 200, true, 'تم جلب الإشعارات بنجاح.', notifications);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return sendResponse(res, 404, false, 'الإشعار ده مش موجود.');
    }
    return sendResponse(res, 200, true, 'تم تحديث الإشعار.', notification);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return sendResponse(res, 200, true, 'تم تحديث كل الإشعارات كـ مقروءة.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMine,
  markAsRead,
  markAllAsRead,
};
