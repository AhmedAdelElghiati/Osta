const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Review = require('../models/Review');

const buildQuery = (q) => {
  const query = {};
  if (q.search) {
    query.$or = [
      { profession: { $regex: q.search, $options: 'i' } },
      { bio: { $regex: q.search, $options: 'i' } },
      { skills: { $in: [new RegExp(q.search, 'i')] } },
    ];
  }
  if (q.profession) query.profession = { $regex: q.profession, $options: 'i' };
  if (q.area) query.serviceAreas = { $in: [new RegExp(q.area, 'i')] };
  if (q.verified === 'true') query.isVerified = true;
  return query;
};

// GET /api/v1/artisans?search=&profession=&area=&verified=&page=&limit=&sort=
const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const sort = req.query.sort === 'price' ? { hourlyRate: 1 } : req.query.sort === 'experience' ? { experienceYears: -1 } : { rating: -1, totalReviews: -1 };
    const query = buildQuery(req.query || {});

    const [artisans, total] = await Promise.all([
      Artisan.find(query).populate('userId', 'name email phone profileImage location isActive').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Artisan.countDocuments(query),
    ]);

    const items = artisans
      .filter((a) => a.userId && a.userId.isActive !== false)
      .map((a) => ({
        id: String(a._id),
        userId: String(a.userId._id),
        name: a.userId.name,
        email: a.userId.email,
        phone: a.userId.phone,
        avatar: a.userId.profileImage || '',
        location: a.userId.location || '',
        profession: a.profession,
        bio: a.bio,
        experienceYears: a.experienceYears,
        skills: a.skills,
        serviceAreas: a.serviceAreas,
        hourlyRate: a.hourlyRate,
        isVerified: a.isVerified,
        rating: a.rating,
        totalReviews: a.totalReviews,
      }));

    return sendResponse(res, 200, true, 'تم جلب الأسطوات بنجاح.', {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/artisans/:id
const getById = async (req, res, next) => {
  try {
    const artisan = await Artisan.findById(req.params.id).populate('userId', 'name email phone profileImage location isActive').lean();
    if (!artisan || !artisan.userId) return sendResponse(res, 404, false, 'الأسطى ده مش موجود.');
    const reviews = await Review.find({ artisanId: artisan.userId._id }).sort({ createdAt: -1 }).limit(10).lean();
    return sendResponse(res, 200, true, 'تم جلب بيانات الأسطى بنجاح.', {
      id: String(artisan._id),
      userId: String(artisan.userId._id),
      name: artisan.userId.name,
      avatar: artisan.userId.profileImage || '',
      location: artisan.userId.location || '',
      profession: artisan.profession,
      bio: artisan.bio,
      experienceYears: artisan.experienceYears,
      skills: artisan.skills,
      serviceAreas: artisan.serviceAreas,
      hourlyRate: artisan.hourlyRate,
      isVerified: artisan.isVerified,
      rating: artisan.rating,
      totalReviews: artisan.totalReviews,
      reviews: reviews.map((r) => ({ id: String(r._id), rating: r.rating, comment: r.comment, createdAt: r.createdAt })),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/artisans/me (artisan updates own profile)
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['profession', 'bio', 'experienceYears', 'skills', 'serviceAreas', 'hourlyRate'];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    const artisan = await Artisan.findOneAndUpdate({ userId: req.user.id }, { $set: patch }, { new: true });
    if (!artisan) return sendResponse(res, 404, false, 'بروفايل الأسطى مش موجود.');
    return sendResponse(res, 200, true, 'تم تحديث بروفايل الأسطى بنجاح.', artisan);
  } catch (error) {
    next(error);
  }
};

module.exports = { list, getById, updateMe };
