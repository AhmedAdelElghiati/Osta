const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const RequestEvent = require('../models/RequestEvent');
const Craft = require('../models/Craft');
const { TRANSITIONS, EDITABLE_STATUSES } = require('../modules/serviceRequests.constants');
const { saveImage, removeImage } = require('./requestStorage.service');

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(404, 'الطلب ده مش موجود.');
};

const ensureCraft = async (craftId) => {
  const craft = await Craft.findOne({ _id: craftId, isActive: true }).lean();
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
  await ensureCraft(input.craftId);
  const request = await ServiceRequest.create({ ...input, customerId, status: 'DRAFT' });
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
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getRequest = (requestId, customerId) => getOwnedRequest(requestId, customerId, true);

const updateRequest = async (requestId, customerId, input) => {
  const request = await getOwnedRequest(requestId, customerId);
  if (!EDITABLE_STATUSES.includes(request.status)) throw fail(409, 'مينفعش تعدّل الطلب ده في حالته الحالية.');
  if (input.craftId) await ensureCraft(input.craftId);
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

module.exports = { createRequest, listRequests, getRequest, updateRequest, publishRequest, cancelRequest, republishRequest, getTimeline, addImages, deleteImage };
