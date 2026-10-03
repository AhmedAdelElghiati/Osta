const router = require('express').Router();
const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Job = require('../models/Job');
const Review = require('../models/Review');
const Craft = require('../models/Craft');

router.post('/assistant', async (req, res, next) => {
  try {
    const message = req.body?.message;
    if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
      return sendResponse(res, 400, false, 'اكتب سؤالاً لا يتجاوز 1000 حرف.');
    }
    let reply;
    if (/دفع|سعر|أسعار|اسعار|الأسعار|الاسعار|فلوس|سحب/.test(message)) {
      reply = 'السعر يحدده عرض الصنايعي الذي تقبله. الإيداع الإلكتروني غير متاح حتى تفعيل بوابة الدفع. طلبات السحب تُسجل للمراجعة ولا تعني إتمام التحويل.';
    } else if (/حرفي|صنايعي|تسجيل|أسجل|اسجل/.test(message)) {
      reply = 'من صفحة إنشاء الحساب اختر صنايعي وأكمل بيانات مهنتك. بعد تسجيل الدخول تظهر الطلبات المنشورة في سوق الشغلانات ويمكنك تقديم عرض عليها.';
    } else if (/حجز|احجز|أحجز|طلب/.test(message)) {
      reply = 'سجل دخولك كعميل ثم انشر طلب صنايعي من لوحة حسابك. ستصلك عروض الصنايعية، وبعد قبول عرض تظهر الشغلانة والمحادثة في حسابكما.';
    } else if (/دعم|مشكلة|مساعد/.test(message)) {
      reply = 'يمكنك إنشاء تذكرة من المساعدة والدعم داخل حساب العميل، أو إرسال رسالة من صفحة تواصل معنا. تظهر الردود الفعلية في التذكرة.';
    } else {
      const crafts = await Craft.find({ isActive: true }).select('name').sort({ name: 1 }).lean();
      reply = crafts.length ? 'الخدمات المتاحة حالياً: ' + crafts.map(craft => craft.name).join('، ') + '. يمكنك نشر طلب من حساب العميل.'
        : 'لا توجد خدمات مفعلة حالياً. يمكنك التواصل مع الدعم من صفحة تواصل معنا.';
    }
    return sendResponse(res, 200, true, 'رد المساعد.', { reply });
  } catch (error) { next(error); }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const activeUsers = await User.find({ isActive: true, role: 'artisan', _id: { $type: 'objectId' } }).distinct('_id');
    const [artisans, verifiedArtisans, completedJobs, reviewStats, customers] = await Promise.all([
      Artisan.countDocuments({ userId: { $in: activeUsers } }),
      Artisan.countDocuments({ userId: { $in: activeUsers }, isVerified: true }),
      Job.countDocuments({ status: 'COMPLETED' }),
      Review.aggregate([{ $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'customer', isActive: true }),
    ]);
    return sendResponse(res, 200, true, 'إحصائيات المنصة.', { artisans, verifiedArtisans, completedJobs,
      customers, rating: reviewStats[0]?.rating ?? null, reviews: reviewStats[0]?.count ?? 0 });
  } catch (error) { next(error); }
});

module.exports = router;
