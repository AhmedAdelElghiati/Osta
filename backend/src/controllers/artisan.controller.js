const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Review = require('../models/Review');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const Joi = require('joi');
const mongoose = require('mongoose');

const getMine = async (req, res, next) => {
  try {
    const artisan = await Artisan.findOne({ userId: req.user.id }).lean();
    if (!artisan) return sendResponse(res, 404, false, 'بروفايل الأسطى مش موجود.');
    const [reviews, completedJobs, totalOffers, acceptedOffers] = await Promise.all([
      Review.find({ artisanId: req.user.id }).populate('customerId', 'name').populate('requestId', 'title').sort({ createdAt: -1 }).lean(),
      Job.countDocuments({ artisanId: req.user.id, status: 'COMPLETED' }),
      Offer.countDocuments({ artisanId: req.user.id }),
      Offer.countDocuments({ artisanId: req.user.id, status: 'ACCEPTED' }),
    ]);
    return sendResponse(res, 200, true, 'تم جلب البروفايل.', {
      ...artisan, rating: reviews.length ? Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length * 100) / 100 : 0,
      totalReviews: reviews.length, reviews, stats: { completedJobs, totalOffers, acceptedOffers,
        acceptanceRate: totalOffers ? Math.round(acceptedOffers / totalOffers * 100) : 0 },
    });
  } catch (error) { next(error); }
};

const buildQuery = (q) => {
  const query = {};
  const escape = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (q.search) {
    query.$or = [
      { profession: { $regex: escape(q.search), $options: 'i' } },
      { bio: { $regex: escape(q.search), $options: 'i' } },
      { skills: { $in: [new RegExp(escape(q.search), 'i')] } },
    ];
  }
  if (q.profession) query.profession = { $regex: escape(q.profession), $options: 'i' };
  if (q.area) query.serviceAreas = { $in: [new RegExp(escape(q.area), 'i')] };
  if (q.verified === 'true') query.isVerified = true;
  if (q.minExperience) query.experienceYears = { $gte: Number(q.minExperience) || 0 };
  if (q.minPrice || q.maxPrice) {
    query.hourlyRate = { $gte: Number(q.minPrice) || 0 };
    if (Number(q.maxPrice) > 0) query.hourlyRate.$lte = Number(q.maxPrice);
  }
  return query;
};

// GET /api/v1/artisans?search=&profession=&area=&verified=&page=&limit=&sort=
const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const sort = req.query.sort === 'price' ? { hourlyRate: 1 } : req.query.sort === 'experience' ? { experienceYears: -1 } : { rating: -1, totalReviews: -1 };
    const query = buildQuery(req.query || {});
    // Older imported accounts can have string IDs that cannot be used by ObjectId references.
    const activeUsers = (await User.find({ isActive: true, role: 'artisan', _id: { $type: 'objectId' } })
      .select('_id name location').lean()).filter(user => mongoose.isObjectIdOrHexString(user._id));
    query.userId = { $in: activeUsers.map(u => u._id) };
    if (req.query.search) {
      const term = String(req.query.search).toLowerCase();
      query.$or.push({ userId: { $in: activeUsers.filter(u => (u.name || '').toLowerCase().includes(term)).map(u => u._id) } });
    }
    if (req.query.area) {
      const term = String(req.query.area).toLowerCase();
      query.$or = query.$or || [];
      const areaQuery = { $or: [{ serviceAreas: query.serviceAreas },
        { userId: { $in: activeUsers.filter(u => (u.location || '').toLowerCase().includes(term)).map(u => u._id) } }] };
      delete query.serviceAreas;
      query.$and = [areaQuery];
      if (!query.$or.length) delete query.$or;
    }

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
        isAvailable: a.isAvailable,
        portfolio: a.portfolio || [],
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
    if (!artisan || !artisan.userId || !artisan.userId.isActive) return sendResponse(res, 404, false, 'الأسطى ده مش موجود.');
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
      isAvailable: artisan.isAvailable,
      portfolio: artisan.portfolio || [],
      reviews: reviews.map((r) => ({ id: String(r._id), rating: r.rating, comment: r.comment, createdAt: r.createdAt })),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/artisans/me (artisan updates own profile)
const updateMe = async (req, res, next) => {
  try {
    const schema = Joi.object({
      profession: Joi.string().trim().max(100), bio: Joi.string().max(5000).allow(''),
      experienceYears: Joi.number().min(0).max(100), hourlyRate: Joi.number().min(0),
      skills: Joi.array().max(30).items(Joi.string().max(100)),
      serviceAreas: Joi.array().max(50).items(Joi.string().max(100)), isAvailable: Joi.boolean(),
      portfolio: Joi.array().max(50).items(Joi.object({
        title: Joi.string().trim().max(200).required(), image: Joi.string().max(2000).allow(''),
      })),
    }).min(1);
    const { error, value } = schema.validate(req.body);
    if (error) return sendResponse(res, 400, false, error.details[0].message);
    const allowed = Object.keys(value);
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    const artisan = await Artisan.findOneAndUpdate({ userId: req.user.id }, { $set: patch }, { new: true, runValidators: true });
    if (!artisan) return sendResponse(res, 404, false, 'بروفايل الأسطى مش موجود.');
    return sendResponse(res, 200, true, 'تم تحديث بروفايل الأسطى بنجاح.', artisan);
  } catch (error) {
    next(error);
  }
};

module.exports = { list, getById, updateMe, getMine };
