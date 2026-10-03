const mongoose = require('mongoose');
const { sendResponse } = require('../utils/apiResponse');
const ChatMessage = require('../models/ChatMessage');
const Job = require('../models/Job');
const DirectConversation = require('../models/DirectConversation');
const Artisan = require('../models/Artisan');
const User = require('../models/User');

const startDirect = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') return sendResponse(res, 403, false, 'المحادثة المباشرة يبدأها العميل.');
    if (!mongoose.isObjectIdOrHexString(req.body.artisanId)) return sendResponse(res, 404, false, 'الأسطى غير موجود.');
    const profile = await Artisan.findById(req.body.artisanId).lean();
    const artisan = profile && await User.findOne({ _id: profile.userId, role: 'artisan', isActive: true });
    if (!artisan) return sendResponse(res, 404, false, 'الأسطى غير موجود.');
    const pair = { customerId: req.user.id, artisanId: artisan._id };
    let conversation;
    try { conversation = await DirectConversation.findOneAndUpdate(pair, { $setOnInsert: pair }, { upsert: true, new: true }); }
    catch (error) { if (error.code !== 11000) throw error; conversation = await DirectConversation.findOne(pair); }
    return sendResponse(res, 200, true, 'تم فتح المحادثة.', { id: `direct:${conversation._id}` });
  } catch (error) { next(error); }
};

const listDirect = async (req, res, next) => {
  try {
    const field = req.user.role === 'customer' ? 'customerId' : 'artisanId';
    const conversations = await DirectConversation.find({ [field]: req.user.id })
      .populate('customerId artisanId', 'name role profileImage').sort({ updatedAt: -1 }).lean();
    return sendResponse(res, 200, true, 'تم تحميل المحادثات.', conversations.map(c => ({ ...c, _id: `direct:${c._id}`, status: 'DIRECT', requestId: { title: 'محادثة مباشرة' } })));
  } catch (error) { next(error); }
};
const { notify } = require('../services/notification.service');

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getOwnedJob = async (jobId, user) => {
  const direct = jobId.startsWith('direct:');
  if (direct) jobId = jobId.slice(7);
  if (!mongoose.isValidObjectId(jobId)) throw fail(404, 'المحادثة دي مش موجودة.');
  const ownerField = user.role === 'customer' ? 'customerId' : 'artisanId';
  const job = await (direct ? DirectConversation : Job).findOne({ _id: jobId, [ownerField]: user.id }).select('_id customerId artisanId');
  if (!job) throw fail(404, 'المحادثة دي مش موجودة.');
  return { ...job.toObject(), direct };
};

const listMessages = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req.params.id, req.user);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const messages = await ChatMessage.find({ [job.direct ? 'conversationId' : 'jobId']: job._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name role profileImage')
      .lean();

    return sendResponse(res, 200, true, 'تم تحميل المحادثة بنجاح.', messages.reverse());
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req.params.id, req.user);
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text || text.length > 2000) {
      return sendResponse(res, 400, false, 'اكتب رسالة من 1 إلى 2000 حرف.');
    }

    const created = await ChatMessage.create({ [job.direct ? 'conversationId' : 'jobId']: job._id, senderId: req.user.id, text });
    const message = await ChatMessage.findById(created._id)
      .populate('senderId', 'name role profileImage')
      .lean();

    if (job.direct) await DirectConversation.updateOne({ _id: job._id }, { $set: { updatedAt: new Date() } });
    req.app.get('io')?.to(`${job.direct ? 'direct' : 'job'}:${job._id}`).emit('chat:message', message);
    await notify(req.user.role === 'customer' ? job.artisanId : job.customerId, 'رسالة جديدة',
      text.slice(0, 200), (req.user.role === 'customer' ? '/dashboard/chat?' : '/customer-dashboard?page=chat&')
        + 'conversation=' + encodeURIComponent(req.params.id), 'MESSAGE_RECEIVED', 'messages');
    return sendResponse(res, 201, true, 'تم إرسال الرسالة بنجاح.', message);
  } catch (error) {
    next(error);
  }
};

module.exports = { listMessages, sendMessage, startDirect, listDirect };
