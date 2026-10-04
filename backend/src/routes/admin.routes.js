const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const ServiceRequest = require('../models/ServiceRequest');
const ContactMessage = require('../models/ContactMessage');
const Transaction = require('../models/Transaction');

const router = express.Router();
router.patch('/users/:id/ban', authenticate, authorize('admin'), require('../controllers/accountBan.controller').setBan);
router.get('/disputes', authenticate, authorize('admin'), require('../controllers/dispute.controller').list);
router.patch('/disputes/:id', authenticate, authorize('admin'), require('../controllers/dispute.controller').review);

// ---- overview ----
router.get('/overview', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [users, activeUsers, artisans, requests, openRequests, completedRequests, pendingVerification, messages, revenue] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      Artisan.countDocuments({}),
      ServiceRequest.countDocuments({}),
      ServiceRequest.countDocuments({ status: { $in: ['PUBLISHED', 'OFFER_ACCEPTED', 'INSPECTION', 'IN_PROGRESS'] } }),
      ServiceRequest.countDocuments({ status: 'COMPLETED' }),
      Artisan.countDocuments({ isVerified: false }),
      ContactMessage.countDocuments({ status: 'NEW' }),
      Transaction.aggregate([{ $match: { type: 'payment', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    return sendResponse(res, 200, true, 'Admin overview', {
      users, activeUsers, artisans, requests, openRequests, completedRequests,
      pendingVerification, unreadMessages: messages, revenue: revenue[0]?.total || 0,
    });
  } catch (error) { next(error); }
});

// ---- users management ----
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) query.$or = [{ name: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }];
    // Use the native collection here because old imported accounts may have string IDs.
    const [items, total] = await Promise.all([
      User.collection.find(query, { projection: { password: 0 } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      User.collection.countDocuments(query),
    ]);
    return sendResponse(res, 200, true, 'Users list', { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
  } catch (error) { next(error); }
});

router.patch('/users/:id/toggle-active', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ids = [req.params.id];
    if (mongoose.isObjectIdOrHexString(req.params.id)) ids.push(new mongoose.Types.ObjectId(req.params.id));
    const current = await User.collection.findOne({ _id: { $in: ids } });
    if (!current) return sendResponse(res, 404, false, 'المستخدم مش موجود.');
    if (current.role === 'admin') return sendResponse(res, 403, false, 'لا يمكن إيقاف حساب إدارة.');
    if (current.isBanned) return sendResponse(res, 409, false, 'فك الحظر أولًا من إجراء الحظر.');
    const isActive = current.isActive === false;
    await User.collection.updateOne({ _id: current._id }, { $set: { isActive, updatedAt: new Date() } });
    return sendResponse(res, 200, true, isActive ? 'تم تفعيل المستخدم.' : 'تم إيقاف المستخدم.', { _id: current._id, isActive });
  } catch (error) { next(error); }
});

// ---- contact inbox ----
router.get('/contact', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const items = await ContactMessage.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return sendResponse(res, 200, true, 'Contact inbox', items);
  } catch (error) { next(error); }
});

router.patch('/contact/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    if (!['NEW', 'READ', 'RESOLVED'].includes(req.body.status)) return sendResponse(res, 400, false, 'حالة الرسالة غير صحيحة.');
    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
    if (!doc) return sendResponse(res, 404, false, 'الرسالة مش موجودة.');
    return sendResponse(res, 200, true, 'تم تحديث حالة الرسالة.', doc);
  } catch (error) { next(error); }
});

// ---- artisan verification ----
router.get('/artisans', authenticate, authorize('admin'), async (_req, res, next) => {
  try {
    const users = await User.collection.find({ role: 'artisan' }, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
    const profiles = await Artisan.collection.find({}).toArray();
    const profileByUser = new Map(profiles.map(profile => [String(profile.userId), profile]));
    const artisans = users.map(user => {
      const profile = profileByUser.get(String(user._id));
      return { ...(profile || {}), profileId: profile?._id || null, userId: user, isVerified: profile?.isVerified === true };
    });
    return sendResponse(res, 200, true, 'قائمة الحرفيين.', artisans);
  } catch (error) { next(error); }
});

router.patch('/artisans/:id/verify', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    if (typeof req.body.isVerified !== 'boolean') return sendResponse(res, 400, false, 'حالة التوثيق لازم تكون صحيحة أو خاطئة.');
    const isVerified = req.body.isVerified;
    const query = mongoose.isObjectIdOrHexString(req.params.id) ? { _id: new mongoose.Types.ObjectId(req.params.id) } : { userId: req.params.id };
    const artisan = await Artisan.collection.findOneAndUpdate(query, { $set: { isVerified, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!artisan) return sendResponse(res, 404, false, 'لا يوجد بروفايل مهني لهذا الحساب.');
    return sendResponse(res, 200, true, 'تم تحديث التوثيق.', artisan);
  } catch (error) { next(error); }
});

router.get('/test', authenticate, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin route access granted',
    data: { role: req.user.role },
  });
});

module.exports = router;

