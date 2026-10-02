const { sendResponse } = require('../utils/apiResponse');
const ContactMessage = require('../models/ContactMessage');

// POST /api/v1/contact  (public — contact-us page)
const create = async (req, res, next) => {
  try {
    const { fullName, phone, contactType = 'business', subject = '', partNumber = '', message } = req.body;
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

module.exports = { create, listMine };
