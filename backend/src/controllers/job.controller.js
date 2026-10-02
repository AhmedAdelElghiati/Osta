const mongoose = require('mongoose');
const { sendResponse } = require('../utils/apiResponse');
const Job = require('../models/Job');
const ServiceRequest = require('../models/ServiceRequest');
const RequestEvent = require('../models/RequestEvent');
const Transaction = require('../models/Transaction');

const populateJob = (query) =>
  query
    .populate('customerId', 'name phone profileImage location')
    .populate('artisanId', 'name phone profileImage location')
    .populate({
      path: 'requestId',
      select: 'title description location budget status craftId',
      populate: { path: 'craftId', select: 'name slug' },
    })
    .populate('offerId', 'price duration warranty notes status');

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(404, 'الشغلانة دي مش موجودة.');
};

const getOwnedJob = async (jobId, user) => {
  ensureObjectId(jobId);
  const ownerField = user.role === 'customer' ? 'customerId' : 'artisanId';
  const job = await Job.findOne({ _id: jobId, [ownerField]: user.id });
  if (!job) throw fail(404, 'الشغلانة دي مش موجودة.');
  return job;
};

const listMine = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const query = req.user.role === 'customer' ? { customerId: req.user.id } : { artisanId: req.user.id };
    if (req.query.status) query.status = req.query.status;

    const [items, total] = await Promise.all([
      populateJob(Job.find(query)).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Job.countDocuments(query),
    ]);

    return sendResponse(res, 200, true, 'تم جلب الشغلانات بنجاح.', {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req.params.id, req.user);
    const fullJob = await populateJob(Job.findById(job._id)).lean();
    return sendResponse(res, 200, true, 'تم جلب الشغلانة بنجاح.', fullJob);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req.params.id, req.user);
    const target = req.body.status;
    const transitions = {
      artisan: { NOT_STARTED: ['IN_PROGRESS'], IN_PROGRESS: ['DELIVERED'] },
      customer: { DELIVERED: ['COMPLETED'] },
    };

    if (!transitions[req.user.role]?.[job.status]?.includes(target)) {
      return sendResponse(res, 409, false, 'مينفعش تنفذ العملية دي في حالة الشغلانة الحالية.');
    }

    job.status = target;
    if (target === 'IN_PROGRESS') {
      job.startedAt = job.startedAt || new Date();
      await ServiceRequest.findByIdAndUpdate(job.requestId, { status: 'IN_PROGRESS' });
      await RequestEvent.create({ requestId: job.requestId, actorId: req.user.id, type: 'JOB_STARTED' });
    }

    if (target === 'DELIVERED') {
      job.deliveryStatus = 'SUBMITTED';
      await ServiceRequest.findByIdAndUpdate(job.requestId, { status: 'DELIVERED' });
      await RequestEvent.create({ requestId: job.requestId, actorId: req.user.id, type: 'JOB_DELIVERED' });
    }

    if (target === 'COMPLETED') {
      job.deliveryStatus = 'APPROVED';
      job.paymentStatus = 'RELEASED';
      job.completedAt = new Date();
      await ServiceRequest.findByIdAndUpdate(job.requestId, { status: 'COMPLETED', completedAt: new Date() });
      await RequestEvent.create({ requestId: job.requestId, actorId: req.user.id, type: 'JOB_COMPLETED' });
      await Transaction.create({
        userId: job.customerId,
        type: 'escrow_release',
        amount: job.price,
        title: 'إغلاق ضمان شغلانة',
        meta: { direction: 'debit', jobId: String(job._id), requestId: String(job.requestId), offerId: String(job.offerId) },
      });
      await Transaction.create({
        userId: job.artisanId,
        type: 'escrow_release',
        amount: job.price,
        title: 'تحرير ضمان شغلانة',
        meta: { direction: 'credit', jobId: String(job._id), requestId: String(job.requestId), offerId: String(job.offerId) },
      });
    }

    await job.save();
    const fullJob = await populateJob(Job.findById(job._id)).lean();
    return sendResponse(res, 200, true, 'تم تحديث حالة الشغلانة بنجاح.', fullJob);
  } catch (error) {
    next(error);
  }
};

module.exports = { listMine, getOne, updateStatus };
