const mongoose = require('mongoose');
const { sendResponse } = require('../utils/apiResponse');
const ServiceRequest = require('../models/ServiceRequest');
const Offer = require('../models/Offer');
const Job = require('../models/Job');
const RequestEvent = require('../models/RequestEvent');
const Transaction = require('../models/Transaction');
const { notify } = require('../services/notification.service');
const Artisan = require('../models/Artisan');

const withArtisanRatings = async (offers) => {
  const profiles = await Artisan.find({ userId: { $in: offers.map(o => o.artisanId?._id) } }).select('userId rating totalReviews').lean();
  const byUser = new Map(profiles.map(p => [String(p.userId), p]));
  return offers.map(o => ({ ...o, artisanProfile: byUser.get(String(o.artisanId?._id)) || null }));
};

const fail = (code, message) => { const e = new Error(message); e.statusCode = code; return e; };

const ensureOwnedRequest = async (requestId, customerId) => {
  if (!mongoose.isValidObjectId(requestId)) throw fail(404, 'الطلب ده مش موجود.');
  const request = await ServiceRequest.findOne({ _id: requestId, customerId });
  if (!request) throw fail(404, 'الطلب ده مش موجود.');
  return request;
};

// ARTISAN: POST /api/v1/offers { requestId, price, duration?, warranty?, notes?, items? }
const create = async (req, res, next) => {
  try {
    const { requestId, price, duration = '', warranty = '', notes = '', items = [] } = req.body;
    if (!requestId || price === undefined) return sendResponse(res, 400, false, 'requestId والسعر مطلوبين.');
    if (!mongoose.isValidObjectId(requestId)) return sendResponse(res, 400, false, 'رقم الطلب غير صحيح.');
    if (Number(price) < 0) return sendResponse(res, 400, false, 'السعر غير صحيح.');

    const requestDoc = await ServiceRequest.findById(requestId);
    if (!requestDoc || !['PUBLISHED', 'OFFER_RECEIVED'].includes(requestDoc.status)) {
      return sendResponse(res, 409, false, 'الطلب ده مش متاح لاستقبال العروض دلوقتي.');
    }
    const exists = await Offer.findOne({ requestId, artisanId: req.user.id, status: 'PENDING' });
    if (exists) return sendResponse(res, 409, false, 'انت باعت عرض على الطلب ده قبل كده.');

    const offer = await Offer.create({
      requestId, artisanId: req.user.id, price: Number(price), duration, warranty, notes, items,
    });

    if (requestDoc.status === 'PUBLISHED') {
      requestDoc.status = 'OFFER_RECEIVED';
      await requestDoc.save();
      await RequestEvent.create({ requestId: requestDoc._id, actorId: req.user.id, type: 'OFFER_RECEIVED' });
    }

    await notify(requestDoc.customerId, 'عرض جديد على طلبك', requestDoc.title, '/customer-dashboard', 'OFFER_RECEIVED', 'offers');
    return sendResponse(res, 201, true, 'تم إرسال العرض بنجاح.', offer);
  } catch (error) { next(error); }
};

// CUSTOMER: GET /api/v1/requests/:id/offers
const listForRequest = async (req, res, next) => {
  try {
    const requestDoc = await ensureOwnedRequest(req.params.id, req.user.id);
    const offers = await Offer.find({ requestId: requestDoc._id }).populate('artisanId', 'name phone profileImage location').sort({ createdAt: -1 }).lean();
    return sendResponse(res, 200, true, 'تم جلب العروض بنجاح.', await withArtisanRatings(offers));
  } catch (error) { next(error); }
};

// CUSTOMER: GET /api/v1/offers/mine (all offers across my requests)
const listMine = async (req, res, next) => {
  try {
    const myRequests = await ServiceRequest.find({ customerId: req.user.id }).select('_id title status').lean();
    const ids = myRequests.map((r) => r._id);
    const offers = await Offer.find({ requestId: { $in: ids } })
      .populate('artisanId', 'name phone profileImage')
      .populate('requestId', 'title status location budget')
      .sort({ createdAt: -1 })
      .lean();
    return sendResponse(res, 200, true, 'تم جلب العروض بنجاح.', await withArtisanRatings(offers));
  } catch (error) { next(error); }
};

// ARTISAN: GET /api/v1/offers/sent
const listSent = async (req, res, next) => {
  try {
    const offers = await Offer.find({ artisanId: req.user.id }).populate('requestId', 'title status location budget').sort({ createdAt: -1 }).lean();
    const jobs = await Job.find({ offerId: { $in: offers.map((offer) => offer._id) }, artisanId: req.user.id }).select('_id offerId requestId status').lean();
    const jobByOffer = new Map(jobs.map((job) => [String(job.offerId), job]));
    const mapped = offers.map((offer) => ({ ...offer, job: jobByOffer.get(String(offer._id)) || null }));
    return sendResponse(res, 200, true, 'تم جلب عروضك بنجاح.', mapped);
  } catch (error) { next(error); }
};

const setStatus = async (req, res, next, target) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendResponse(res, 404, false, 'العرض ده مش موجود.');
    const offer = await Offer.findById(id);
    if (!offer) return sendResponse(res, 404, false, 'العرض ده مش موجود.');
    const requestDoc = await ensureOwnedRequest(String(offer.requestId), req.user.id);
    if (offer.status !== 'PENDING') return sendResponse(res, 409, false, 'العرض ده اتقفل قبل كده.');

    if (target === 'ACCEPTED') {
      if (!['PUBLISHED', 'OFFER_RECEIVED'].includes(requestDoc.status)) {
        return sendResponse(res, 409, false, 'الطلب ده اتقفل ومينفعش تقبل عليه عروض دلوقتي.');
      }
      offer.status = 'ACCEPTED';
      await offer.save();
      await Offer.updateMany({ requestId: offer.requestId, _id: { $ne: offer._id }, status: 'PENDING' }, { $set: { status: 'REJECTED' } });
      requestDoc.status = 'OFFER_ACCEPTED';
      await requestDoc.save();
      let job;
      try {
        job = await Job.create({
          customerId: requestDoc.customerId,
          artisanId: offer.artisanId,
          requestId: requestDoc._id,
          offerId: offer._id,
          price: offer.price,
          expectedCompletion: offer.duration ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
        });
      } catch (error) {
        if (error.code === 11000) {
          job = await Job.findOne({ requestId: requestDoc._id });
        } else {
          throw error;
        }
      }
      await Transaction.create({
        userId: requestDoc.customerId,
        type: 'escrow_hold',
        amount: offer.price,
        title: 'حجز ضمان شغلانة',
        meta: { direction: 'debit', jobId: String(job._id), requestId: String(requestDoc._id), offerId: String(offer._id) },
      });
      await RequestEvent.create({ requestId: requestDoc._id, actorId: req.user.id, type: 'OFFER_ACCEPTED', metadata: { offerId: String(offer._id) } });
      await RequestEvent.create({ requestId: requestDoc._id, actorId: req.user.id, type: 'JOB_CREATED', metadata: { jobId: String(job._id) } });
      await notify(offer.artisanId, 'العميل قبل عرضك', requestDoc.title, '/dashboard/my-jobs', 'OFFER_ACCEPTED', 'offers');
      return sendResponse(res, 200, true, 'تم قبول العرض وإنشاء الشغلانة بنجاح.', { offer, job });
    }
    offer.status = 'REJECTED';
    await offer.save();
    await RequestEvent.create({ requestId: requestDoc._id, actorId: req.user.id, type: 'OFFER_REJECTED', metadata: { offerId: String(offer._id) } });
    await notify(offer.artisanId, 'تم رفض العرض', requestDoc.title, '/dashboard/sent-offers', 'OFFER_REJECTED', 'offers');
    return sendResponse(res, 200, true, 'تم رفض العرض.', offer);
  } catch (error) { next(error); }
};

const accept = (req, res, next) => setStatus(req, res, next, 'ACCEPTED');
const reject = (req, res, next) => setStatus(req, res, next, 'REJECTED');

// ARTISAN withdraw own pending offer
const withdraw = async (req, res, next) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.id, artisanId: req.user.id });
    if (!offer) return sendResponse(res, 404, false, 'العرض ده مش موجود.');
    if (offer.status !== 'PENDING') return sendResponse(res, 409, false, 'مينفعش تسحب العرض ده دلوقتي.');
    offer.status = 'WITHDRAWN';
    await offer.save();
    return sendResponse(res, 200, true, 'تم سحب العرض بنجاح.', offer);
  } catch (error) { next(error); }
};

module.exports = { create, listForRequest, listMine, listSent, accept, reject, withdraw };
