const { sendResponse } = require('../utils/apiResponse');
const ContactMessage = require('../models/ContactMessage');
const mongoose = require('mongoose');
const User = require('../models/User');
const Joi = require('joi');

const createTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (typeof subject !== 'string' || !subject.trim() || subject.length > 200 ||
        typeof message !== 'string' || !message.trim() || message.length > 5000) {
      return sendResponse(res, 400, false, 'اكتب عنوان وتفاصيل صحيحة للتذكرة.');
    }
    const user = await User.findById(req.user.id).select('name phone');
    const doc = await ContactMessage.create({ userId: req.user.id, fullName: user.name,
      phone: user.phone, contactType: 'personal', subject: subject.trim(), message: message.trim() });
    return sendResponse(res, 201, true, 'تم تسجيل التذكرة.', doc);
  } catch (error) { next(error); }
};

const reply = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendResponse(res, 404, false, 'التذكرة مش موجودة.');
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text || text.length > 5000) return sendResponse(res, 400, false, 'اكتب رسالة من 1 إلى 5000 حرف.');
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.userId = req.user.id;
    const doc = await ContactMessage.findOneAndUpdate(query, {
      $push: { replies: { senderId: req.user.id, senderRole: req.user.role, text, createdAt: new Date() } },
      $set: { status: req.user.role === 'admin' ? 'READ' : 'NEW' },
    }, { new: true, runValidators: true });
    if (!doc) return sendResponse(res, 404, false, 'التذكرة مش موجودة.');
    return sendResponse(res, 201, true, 'تم إرسال الرسالة.', doc);
  } catch (error) { next(error); }
};

// POST /api/v1/contact  (public — contact-us page)
const create = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      fullName: Joi.string().trim().min(3).max(100).required(),
      phone: Joi.string().trim().pattern(/^01[0125][0-9]{8}$/).required(),
      contactType: Joi.string().valid('business', 'personal', 'company').default('business'),
      subject: Joi.string().trim().max(200).allow('').default(''),
      partNumber: Joi.string().trim().max(20).allow('').default(''),
      message: Joi.string().trim().min(10).max(5000).required(),
    }).validate(req.body);
    if (error) return sendResponse(res, 400, false, 'اكتب اسمًا من 3 إلى 100 حرف، ورقم موبايل مصري صحيح، ورسالة من 10 إلى 5000 حرف.');
    const { fullName, phone, contactType, subject, partNumber, message } = value;
    if (!fullName || String(fullName).trim().length < 3) return sendResponse(res, 400, false, 'من فضلك اكتب الاسم بالكامل بشكل صحيح.');
    if (!phone || !/^01[0125][0-9]{8}$/.test(String(phone).trim())) return sendResponse(res, 400, false, 'من فضلك اكتب رقم موبايل مصري صحيح.');
    if (!message || String(message).trim().length < 10) return sendResponse(res, 400, false, 'من فضلك اكتب تفاصيل الرسالة بشكل أوضح.');
    const doc = await ContactMessage.create({
      userId: req.user ? req.user.id : null,
      fullName: String(fullName).trim(), phone: String(phone).trim(), contactType, subject, partNumber,
      message: String(message).trim(),
    });
    return sendResponse(res, 201, true, 'تم إرسال رسالتك بنجاح، وهنتواصل معاك في أقرب وقت.', { id: doc._id });
  } catch (error) { next(error); }
};

// GET /api/v1/contact/mine — رسايلي أنا
const listMine = async (req, res, next) => {
  try {
    const items = await ContactMessage.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    return sendResponse(res, 200, true, 'تم جلب رسائلك بنجاح.', items);
  } catch (error) { next(error); }
};

module.exports = { create, listMine, createTicket, reply };
