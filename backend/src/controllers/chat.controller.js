// backend/src/controllers/chat.controller.js
const Job = require('../models/Job');
const Message = require('../models/Message');
const { sendResponse } = require('../utils/apiResponse');

const loadJobForUser = async (jobId, userId) => {
  const job = await Job.findById(jobId).lean();
  if (!job) return null;
  const allowed = [String(job.customerId), String(job.artisanId)].includes(String(userId));
  return allowed ? job : null;
};

const list = async (req, res, next) => {
  try {
    const job = await loadJobForUser(req.params.id, req.user._id || req.user.id);
    if (!job) return sendResponse(res, 404, false, 'Job not found');
    const items = await Message.find({ jobId: job._id }).sort({ createdAt: 1 }).limit(500).lean();
    const me = String(req.user._id || req.user.id);
    return sendResponse(res, 200, true, 'Messages fetched', items.map((m) => ({ ...m, mine: String(m.senderId) === me })));
  } catch (e) { next(e); }
};

const send = async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return sendResponse(res, 400, false, 'Message text is required');
    const job = await loadJobForUser(req.params.id, req.user._id || req.user.id);
    if (!job) return sendResponse(res, 404, false, 'Job not found');
    const msg = await Message.create({ jobId: job._id, senderId: req.user._id || req.user.id, text: text.slice(0, 1000) });
    return sendResponse(res, 201, true, 'Message sent', { ...msg.toObject(), mine: true });
  } catch (e) { next(e); }
};

module.exports = { list, send };
