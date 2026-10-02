const mongoose = require('mongoose');
const { sendResponse } = require('../utils/apiResponse');
const ServiceRequest = require('../models/ServiceRequest');
const Offer = require('../models/Offer');
const Review = require('../models/Review');
const Artisan = require('../models/Artisan');
const RequestEvent = require('../models/RequestEvent');

// POST /api/v1/requests/:id/review  { rating, comment? } — customer rates accepted/completed job
const createForRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment = '' } = req.body;
    if (!mongoose.isValidObjectId(id)) return sendResponse(res, 404, false, 'الطلب ده مش موجود.');
    if (!rating || Number(rating) < 1 || Number(rating) > 5) return sendResponse(res, 400, false, 'التقييم لازم يكون من 1 لـ 5.');

    const requestDoc = await ServiceRequest.findOne({ _id: id, customerId: req.user.id });
    if (!requestDoc) return sendResponse(res, 404, false, 'الطلب ده مش موجود.');
    if (!['OFFER_ACCEPTED', 'COMPLETED', 'DELIVERED'].includes(requestDoc.status)) {
      return sendResponse(res, 409, false, 'مينفعش تقيّم الطلب ده دلوقتي.');
    }
    const accepted = await Offer.findOne({ requestId: requestDoc._id, status: 'ACCEPTED' });
    if (!accepted) return sendResponse(res, 409, false, 'مفيش عرض مقبول على الطلب ده.');

    const exists = await Review.findOne({ requestId: requestDoc._id });
    if (exists) return sendResponse(res, 409, false, 'انت قيّمت الطلب ده قبل كده.');

    const review = await Review.create({
      requestId: requestDoc._id, artisanId: accepted.artisanId, customerId: req.user.id,
      rating: Number(rating), comment: String(comment),
    });

    // حدّث متوسط تقييم الأسطى
    const stats = await Review.aggregate([
      { $match: { artisanId: accepted.artisanId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length) {
      await Artisan.findOneAndUpdate({ userId: accepted.artisanId }, { $set: { rating: Math.round(stats[0].avg * 100) / 100, totalReviews: stats[0].count } });
    }
    await RequestEvent.create({ requestId: requestDoc._id, actorId: req.user.id, type: 'REVIEW_SUBMITTED', metadata: { rating: Number(rating) } });

    return sendResponse(res, 201, true, 'تم إرسال تقييمك بنجاح.', review);
  } catch (error) { next(error); }
};

// GET /api/v1/artisans/:id/reviews
const listForArtisan = async (req, res, next) => {
  try {
    const artisan = await Artisan.findById(req.params.id).lean();
    if (!artisan) return sendResponse(res, 404, false, 'الأسطى ده مش موجود.');
    const reviews = await Review.find({ artisanId: artisan.userId }).populate('customerId', 'name').sort({ createdAt: -1 }).lean();
    return sendResponse(res, 200, true, 'تم جلب التقييمات بنجاح.', reviews);
  } catch (error) { next(error); }
};

module.exports = { createForRequest, listForArtisan };
