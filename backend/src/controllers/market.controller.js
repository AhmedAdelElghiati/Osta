const { sendResponse } = require('../utils/apiResponse');
const ServiceRequest = require('../models/ServiceRequest');

// GET /api/v1/market — سوق الشغلانات: كل الطلبات المنشورة (للحرفيين) مع فلاتر
// GET /api/v1/market/stats — إحصائيات عامة للصفحة الرئيسية ودليل الأسطوات
const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const query = { status: { $in: ['PUBLISHED', 'OFFER_RECEIVED'] } };
    if (req.query.craftId) query.craftId = req.query.craftId;
    if (req.query.city) query['location.city'] = { $regex: req.query.city, $options: 'i' };
    if (req.query.search) query.$text = { $search: req.query.search };

    const [items, total] = await Promise.all([
      ServiceRequest.find(query).populate('craftId', 'name slug').populate('customerId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ServiceRequest.countDocuments(query),
    ]);
    const mapped = items.map((r) => ({
      id: String(r._id), title: r.title, description: r.description,
      craft: r.craftId ? { id: String(r.craftId._id), name: r.craftId.name, slug: r.craftId.slug } : null,
      city: r.location?.city || '', area: r.location?.area || '',
      budget: r.budget, preferredDate: r.preferredDate, status: r.status,
      customerName: r.customerId?.name || '', createdAt: r.createdAt, photoCount: (r.images || []).length,
    }));
    return sendResponse(res, 200, true, 'تم جلب سوق الشغلانات بنجاح.', {
      items: mapped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) { next(error); }
};

const stats = async (req, res, next) => {
  try {
    const [openJobs, completedJobs, artisansCount] = await Promise.all([
      ServiceRequest.countDocuments({ status: { $in: ['PUBLISHED', 'OFFER_RECEIVED'] } }),
      ServiceRequest.countDocuments({ status: 'COMPLETED' }),
      require('../models/Artisan').countDocuments({}),
    ]);
    return sendResponse(res, 200, true, 'تم جلب الإحصائيات بنجاح.', { openJobs, completedJobs, artisansCount });
  } catch (error) { next(error); }
};

module.exports = { list, stats };
