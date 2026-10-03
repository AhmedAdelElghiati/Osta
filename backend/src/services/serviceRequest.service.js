const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const RequestEvent = require('../models/RequestEvent');
const { TRANSITIONS, EDITABLE_STATUSES } = require('../modules/serviceRequests.constants');
const { saveImage, removeImage } = require('./requestStorage.service');
const { findActiveCraft } = require('./craftCatalog.service');
const Offer = require('../models/Offer');
const Job = require('../models/Job');
const Artisan = require('../models/Artisan');
const Review = require('../models/Review');

const enrichRequests = async (items) => {
  const ids = items.map(item => item._id);
  const [counts, jobs, reviews] = await Promise.all([
    Offer.aggregate([{ $match: { requestId: { $in: ids }, status: { $ne: 'WITHDRAWN' } } },
      { $group: { _id: '$requestId', count: { $sum: 1 } } }]),
    Job.find({ requestId: { $in: ids } }).populate('artisanId', 'name profileImage').lean(),
    Review.find({ requestId: { $in: ids } }).select('requestId rating').lean(),
  ]);
  const profiles = await Artisan.find({ userId: { $in: jobs.map(j => j.artisanId?._id) } }).select('userId profession rating').lean();
  const completed = await Job.aggregate([{ $match: { artisanId: { $in: profiles.map(p => p.userId) }, status: 'COMPLETED' } },
    { $group: { _id: '$artisanId', count: { $sum: 1 } } }]);
  const jobsByRequest = new Map(jobs.map(j => [String(j.requestId), j]));
  return items.map(item => {
    const id = String(item._id), job = jobsByRequest.get(id);
    const profile = profiles.find(p => String(p.userId) === String(job?.artisanId?._id));
    return { ...item, offerCount: counts.find(c => String(c._id) === id)?.count || 0,
      artisanId: job?.artisanId ? { ...job.artisanId, category: profile?.profession || '', rating: profile?.rating || 0,
        jobs: completed.find(c => String(c._id) === String(job.artisanId._id))?.count || 0, price: job.price } : null,
      jobId: job?._id || null, acceptedPrice: job?.price, paymentStatus: job?.paymentStatus,
      reviewed: reviews.some(r => String(r.requestId) === id) };
  });
};

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(404, 'الطلب ده مش موجود.');
};

const ensureCraft = async (craftId) => {
  const craft = await findActiveCraft(craftId);
  if (!craft) throw fail(400, 'نوع الخدمة غير موجود أو مش متاح دلوقتي.');
  return craft;
};

const addEvent = (requestId, actorId, type, metadata) => RequestEvent.create({ requestId, actorId, type, metadata });

const getOwnedRequest = async (requestId, customerId, populateCraft = false) => {
  ensureId(requestId);
  let query = ServiceRequest.findOne({ _id: requestId, customerId });
  if (populateCraft) query = query.populate('craftId', 'name slug description');
  const request = await query;
  if (!request) throw fail(404, 'الطلب ده مش موجود.');
  return request;
};

const validatePublishable = (request) => {
  const required = request.title && request.description && request.craftId && request.location && request.budget;
  if (!required) throw fail(400, 'لازم تكمل بيانات الطلب قبل ما تنشره.');
};

const createRequest = async (customerId, input) => {
  const craft = await ensureCraft(input.craftId);
  const request = await ServiceRequest.create({ ...input, craftId: craft._id, customerId, status: 'DRAFT' });
  await addEvent(request._id, customerId, 'REQUEST_CREATED');
  return getOwnedRequest(request._id, customerId, true);
};

const listRequests = async (customerId, filters) => {
  const { page, limit, status, craftId, search, sortBy, sortOrder } = filters;
  const query = { customerId };
  if (status) query.status = status;
  if (craftId) query.craftId = craftId;
  if (search) query.$text = { $search: search };
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [items, total] = await Promise.all([
    ServiceRequest.find(query).populate('craftId', 'name slug').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    ServiceRequest.countDocuments(query),
  ]);
  return { items: await enrichRequests(items), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getRequest = async (requestId, customerId) => {
  const request = await getOwnedRequest(requestId, customerId, true);
  return (await enrichRequests([request.toObject()]))[0];
};

const scheduleRequest = async (requestId, customerId, input) => {
  const request = await getOwnedRequest(requestId, customerId);
  if (!['OFFER_ACCEPTED', 'INSPECTION'].includes(request.status)) throw fail(409, 'لا يمكن تحديد معاينة في الحالة الحالية.');
  request.preferredDate = input.preferredDate;
  request.preferredTime = input.preferredTime;
  await request.save();
  await addEvent(request._id, customerId, 'REQUEST_UPDATED', { fields: ['preferredDate', 'preferredTime'] });
  const job = await Job.findOne({ requestId: request._id });
  if (job) await require('./notification.service').notify(job.artisanId, 'تم تحديد موعد المعاينة',
    input.preferredDate + ' ' + input.preferredTime, '/dashboard/my-jobs');
  return getRequest(requestId, customerId);
};

const updateRequest = async (requestId, customerId, input) => {
  const request = await getOwnedRequest(requestId, customerId);
  if (!EDITABLE_STATUSES.includes(request.status)) throw fail(409, 'مينفعش تعدّل الطلب ده في حالته الحالية.');
  if (input.craftId) {
    const craft = await ensureCraft(input.craftId);
    input.craftId = craft._id;
  }
  Object.assign(request, input);
  await request.save();
  await addEvent(request._id, customerId, 'REQUEST_UPDATED', { fields: Object.keys(input) });
  return getOwnedRequest(request._id, customerId, true);
};

const transition = async (requestId, customerId, targetStatus, eventType) => {
  const request = await getOwnedRequest(requestId, customerId);
  if (!TRANSITIONS[request.status]?.includes(targetStatus)) {
    throw fail(409, 'مينفعش تنفذ العملية دي دلوقتي.');
  }
  request.status = targetStatus;
  if (targetStatus === 'PUBLISHED') {
    request.publishedAt = new Date();
    request.cancelledAt = undefined;
    request.cancellationReason = undefined;
  }
  await request.save();
  await addEvent(request._id, customerId, eventType);
  return getOwnedRequest(request._id, customerId, true);
};

const publishRequest = async (requestId, customerId) => {
  const request = await getOwnedRequest(requestId, customerId);
  validatePublishable(request);
  return transition(requestId, customerId, 'PUBLISHED', 'REQUEST_PUBLISHED');
};

const cancelRequest = async (requestId, customerId, reason) => {
  const request = await getOwnedRequest(requestId, customerId);
  if (request.status === 'CANCELLED') throw fail(409, 'الطلب ده اتلغى بالفعل.');
  if (request.status === 'COMPLETED') throw fail(409, 'مينفعش تلغي طلب مكتمل.');
  if (!TRANSITIONS[request.status]?.includes('CANCELLED')) throw fail(409, 'مينفعش تلغي الطلب ده في حالته الحالية.');
  request.status = 'CANCELLED';
  request.cancelledAt = new Date();
  request.cancellationReason = reason;
  await request.save();
  await addEvent(request._id, customerId, 'REQUEST_CANCELLED', { reason });
  return getOwnedRequest(request._id, customerId, true);
};

const republishRequest = (requestId, customerId) => transition(requestId, customerId, 'PUBLISHED', 'REQUEST_REPUBLISHED');

const getTimeline = async (requestId, customerId) => {
  const request = await getOwnedRequest(requestId, customerId);
  return RequestEvent.find({ requestId: request._id }).sort({ createdAt: 1 }).populate('actorId', 'name role').lean();
};

const addImages = async (requestId, customerId, files) => {
  const request = await getOwnedRequest(requestId, customerId);
  if (request.images.length + files.length > 10) throw fail(400, 'مينفعش تضيف أكتر من 10 صور للطلب.');
  const savedImages = [];
  try {
    for (const file of files) savedImages.push({ ...await saveImage(file), originalName: file.originalname, mimeType: file.mimetype, size: file.size });
    request.images.push(...savedImages);
    await request.save();
    return request;
  } catch (error) {
    await Promise.all(savedImages.map((image) => removeImage(image.publicId)));
    throw error;
  }
};

const deleteImage = async (requestId, customerId, imageId) => {
  const request = await getOwnedRequest(requestId, customerId);
  const image = request.images.id(imageId);
  if (!image) throw fail(404, 'الصورة دي مش موجودة.');
  const publicId = image.publicId;
  image.deleteOne();
  await request.save();
  await removeImage(publicId);
  return request;
};

module.exports = { createRequest, listRequests, getRequest, updateRequest, publishRequest, cancelRequest, republishRequest, getTimeline, addImages, deleteImage, scheduleRequest };

