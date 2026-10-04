const mongoose = require('mongoose');
const Joi = require('joi');
const User = require('../models/User');
const Session = require('../models/Session');
const AccountBan = require('../models/AccountBan');
const { normalizeEmail, normalizePhone } = require('../utils/identity');
const { sendResponse } = require('../utils/apiResponse');

const schema = Joi.object({
  banned: Joi.boolean().strict().required(),
  reason: Joi.when('banned', { is: true, then: Joi.string().trim().min(3).max(1000).required(), otherwise: Joi.string().trim().max(1000).allow('') }),
}).unknown(false);

exports.setBan = async (req, res, next) => {
  try {
    const { error, value } = schema.validate(req.body);
    if (error) return sendResponse(res, 400, false, 'حدد حالة الحظر واكتب سببًا من 3 إلى 1000 حرف.');
    const ids = [req.params.id];
    if (mongoose.isObjectIdOrHexString(req.params.id)) ids.push(new mongoose.Types.ObjectId(req.params.id));
    const user = await User.collection.findOne({ _id: { $in: ids } });
    if (!user) return sendResponse(res, 404, false, 'الحساب غير موجود.');
    if (!['customer', 'artisan'].includes(user.role)) return sendResponse(res, 403, false, 'حظر حسابات الإدارة غير مسموح.');
    const id = String(user._id);
    if (value.banned) {
      await AccountBan.findOneAndUpdate({ userId: id }, { $set: {
        email: normalizeEmail(user.email), phone: normalizePhone(user.phone), reason: value.reason, bannedBy: String(req.user.id),
      } }, { upsert: true, new: true, runValidators: true });
      await User.collection.updateOne({ _id: user._id }, { $set: {
        isBanned: true, isActive: false, banReason: value.reason, bannedAt: new Date(), updatedAt: new Date(),
        resetPasswordTokenHash: null, resetPasswordExpiresAt: null,
      } });
      await Session.collection.updateMany({ userId: { $in: [user._id, id] } }, { $set: { revokedAt: new Date() } });
      req.app.get('io')?.in(`user:${id}`).disconnectSockets(true);
    } else {
      await User.collection.updateOne({ _id: user._id }, { $set: { isBanned: false, isActive: true, banReason: '', bannedAt: null, updatedAt: new Date() } });
      await AccountBan.deleteOne({ userId: id });
    }
    const updated = await User.collection.findOne({ _id: user._id }, { projection: { name: 1, email: 1, phone: 1, role: 1, isActive: 1, isBanned: 1, banReason: 1, bannedAt: 1 } });
    return sendResponse(res, 200, true, value.banned ? 'تم حظر الحساب ومنع الدخول وإعادة التسجيل بنفس البيانات.' : 'تم فك الحظر.', updated);
  } catch (error) { next(error); }
};
