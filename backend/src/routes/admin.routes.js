const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const ServiceRequest = require('../models/ServiceRequest');
const ContactMessage = require('../models/ContactMessage');
const Transaction = require('../models/Transaction');

const router = express.Router();

// ---- overview ----
router.get('/overview', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [users, artisans, requests, messages, revenue] = await Promise.all([
      User.countDocuments({}),
      Artisan.countDocuments({}),
      ServiceRequest.countDocuments({}),
      ContactMessage.countDocuments({ status: 'NEW' }),
      Transaction.aggregate([{ $match: { type: 'payment', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    return sendResponse(res, 200, true, 'Admin overview', {
      users, artisans, requests, unreadMessages: messages, revenue: revenue[0]?.total || 0,
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
    const [items, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return sendResponse(res, 200, true, 'Users list', { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
  } catch (error) { next(error); }
});

router.patch('/users/:id/toggle-active', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendResponse(res, 404, false, 'المستخدم مش موجود.');
    user.isActive = !user.isActive;
    await user.save();
    return sendResponse(res, 200, true, user.isActive ? 'تم تفعيل المستخدم.' : 'تم إيقاف المستخدم.', user);
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
    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status || 'READ' } }, { new: true });
    if (!doc) return sendResponse(res, 404, false, 'الرسالة مش موجودة.');
    return sendResponse(res, 200, true, 'تم تحديث حالة الرسالة.', doc);
  } catch (error) { next(error); }
});

// ---- artisan verification ----
router.get('/artisans', authenticate, authorize('admin'), async (_req, res, next) => {
  try {
    const artisans = await Artisan.find({}).populate('userId', 'name email isActive').sort({ createdAt: -1 }).lean();
    return sendResponse(res, 200, true, 'قائمة الحرفيين.', artisans);
  } catch (error) { next(error); }
});

router.patch('/artisans/:id/verify', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const artisan = await Artisan.findByIdAndUpdate(req.params.id, { $set: { isVerified: req.body.isVerified !== false } }, { new: true });
    if (!artisan) return sendResponse(res, 404, false, 'الأسطى مش موجود.');
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

