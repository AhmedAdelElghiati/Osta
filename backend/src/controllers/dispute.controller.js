const mongoose = require('mongoose');
const Joi = require('joi');
const Job = require('../models/Job');
const { sendResponse } = require('../utils/apiResponse');
const { notify } = require('../services/notification.service');

const openSchema = Joi.object({
  reason: Joi.string().valid('QUALITY', 'INCOMPLETE', 'DAMAGE', 'OTHER').required(),
  description: Joi.string().trim().min(10).max(5000).required(),
}).unknown(false);
const decisionSchema = Joi.object({
  status: Joi.string().valid('UNDER_REVIEW', 'RESOLVED', 'REJECTED').required(),
  decision: Joi.string().trim().min(10).max(5000).required(),
}).unknown(false);

exports.open = async (req, res, next) => {
  try {
    const { error, value } = openSchema.validate(req.body);
    if (error) return sendResponse(res, 400, false, 'اختر سبب النزاع واكتب وصفًا من 10 إلى 5000 حرف.');
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return sendResponse(res, 404, false, 'الشغلانة غير موجودة.');
    const owned = await Job.findOne({ _id: req.params.id, customerId: req.user.id }).lean();
    if (!owned) return sendResponse(res, 404, false, 'الشغلانة غير موجودة.');
    if (['OPEN', 'UNDER_REVIEW'].includes(owned.dispute?.status)) return sendResponse(res, 409, false, 'يوجد نزاع مفتوح بالفعل.');
    const update = { $set: { dispute: { ...value, status: 'OPEN', openedAt: new Date(), paymentStatusAtOpening: owned.paymentStatus } } };
    if (['RESOLVED', 'REJECTED'].includes(owned.dispute?.status)) update.$push = { disputeHistory: owned.dispute };
    const job = await Job.findOneAndUpdate({
      _id: owned._id, customerId: req.user.id,
      status: { $in: ['DELIVERED', 'COMPLETED'] }, paymentProcessing: { $ne: true },
      paymentStatus: owned.paymentStatus,
      'dispute.status': owned.dispute?.status || { $exists: false },
    }, update, { new: true, runValidators: true });
    if (!job) return sendResponse(res, 409, false, 'النزاع متاح بعد التسليم فقط، ومينفعش تفتح نزاع مكرر أو أثناء تحرير الدفعة.');
    await notify(job.artisanId, 'نزاع جديد على الشغلانة', value.description.slice(0, 200), '/dashboard/my-jobs');
    return sendResponse(res, 201, true, 'تم فتح النزاع. الدفعة غير المحررة تظل محجوزة لحين المراجعة.', job);
  } catch (error) { next(error); }
};

exports.list = async (_req, res, next) => {
  try {
    const jobs = await Job.find({ 'dispute.status': { $in: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] } })
      .populate('customerId artisanId', 'name').populate('requestId', 'title')
      .sort({ 'dispute.openedAt': -1 }).limit(100).lean();
    return sendResponse(res, 200, true, 'النزاعات', jobs);
  } catch (error) { next(error); }
};

exports.review = async (req, res, next) => {
  try {
    const { error, value } = decisionSchema.validate(req.body);
    if (error) return sendResponse(res, 400, false, 'اختر حالة صحيحة واكتب قرارًا من 10 إلى 5000 حرف.');
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return sendResponse(res, 404, false, 'النزاع غير موجود.');
    const job = await Job.findOneAndUpdate({ _id: req.params.id, 'dispute.status': { $in: ['OPEN', 'UNDER_REVIEW'] } }, {
      $set: { 'dispute.status': value.status, 'dispute.decision': value.decision, 'dispute.reviewedBy': req.user.id,
        'dispute.resolvedAt': value.status === 'UNDER_REVIEW' ? null : new Date() },
    }, { new: true, runValidators: true });
    if (!job) return sendResponse(res, 409, false, 'النزاع غير موجود أو تم إغلاقه بالفعل.');
    await notify(job.customerId, 'تحديث النزاع', value.decision.slice(0, 200), '/customer-dashboard?page=requests');
    await notify(job.artisanId, 'تحديث النزاع', value.decision.slice(0, 200), '/dashboard/my-jobs');
    return sendResponse(res, 200, true, 'تم تحديث النزاع دون إجراء تحويل أو استرجاع مالي تلقائي.', job);
  } catch (error) { next(error); }
};
