const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Joi = require('joi');

const settingsSchema = Joi.object({
  notifications: Joi.object({
    requests: Joi.boolean(), offers: Joi.boolean(), messages: Joi.boolean(), updates: Joi.boolean(),
  }),
  addresses: Joi.array().max(20).items(Joi.object({
    id: Joi.string().max(100).required(), title: Joi.string().trim().max(100).required(),
    address: Joi.string().trim().max(500).required(),
  })),
  paymentMethods: Joi.array().max(10).items(Joi.object({
    id: Joi.string().max(100).required(), type: Joi.string().max(50).required(),
    lastFour: Joi.string().pattern(/^\d{1,4}$/).required(),
    details: Joi.string().max(100).required(), icon: Joi.string().valid('bi-phone', 'bi-credit-card').required(),
  })),
  payout: Joi.object({ provider: Joi.string().max(100).allow(''), number: Joi.string().max(50).allow('') }),
}).min(1);

const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('settings');
    return sendResponse(res, 200, true, 'تم جلب الإعدادات.', user.settings);
  } catch (error) { next(error); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { error, value } = settingsSchema.validate(req.body);
    if (error) return sendResponse(res, 400, false, error.details[0].message);
    const patch = {};
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'notifications' || key === 'payout') {
        Object.entries(item).forEach(([field, entry]) => { patch[`settings.${key}.${field}`] = entry; });
      } else patch[`settings.${key}`] = item;
    });
    const user = await User.findByIdAndUpdate(req.user.id, { $set: patch }, { new: true, runValidators: true }).select('settings');
    return sendResponse(res, 200, true, 'تم حفظ الإعدادات.', user.settings);
  } catch (error) { next(error); }
};

// PATCH /api/users/me  (customer/artisan updates own basic profile)
const updateMe = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().trim().min(2).max(100),
      phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/),
      location: Joi.string().trim().max(200).allow(''),
      profileImage: Joi.string().max(2000).allow(''),
      profession: Joi.string().trim().min(2).max(100),
      bio: Joi.string().trim().max(5000).allow(''),
      experienceYears: Joi.number().min(0).max(100),
      skills: Joi.array().max(30).items(Joi.string().trim().min(1).max(100)),
      serviceAreas: Joi.array().max(50).items(Joi.string().trim().min(1).max(100)),
      hourlyRate: Joi.number().min(0).max(100000000),
    }).min(1);
    const { error, value } = schema.validate(req.body);
    if (error) return sendResponse(res, 400, false, 'راجع بياناتك: الاسم حرفان على الأقل ورقم الهاتف من 7 إلى 15 رقمًا والأسعار والخبرة غير سالبة.');
    const professional = ['profession', 'bio', 'experienceYears', 'skills', 'serviceAreas', 'hourlyRate'];
    if (req.user.role !== 'artisan' && professional.some(key => value[key] !== undefined)) {
      return sendResponse(res, 403, false, 'البيانات المهنية متاحة لحساب الصنايعي فقط.');
    }
    const allowed = ['name', 'phone', 'location', 'profileImage'];
    const patch = {};
    allowed.forEach((k) => { if (value[k] !== undefined) patch[k] = value[k]; });
    if (patch.phone) {
      const clash = await User.findOne({ phone: patch.phone, _id: { $ne: req.user.id } });
      if (clash) return sendResponse(res, 409, false, 'رقم الموبايل ده متسجل قبل كده.');
    }
    if (patch.name && String(patch.name).trim().length < 2) return sendResponse(res, 400, false, 'الاسم قصير أوي.');
    const user = await User.findByIdAndUpdate(req.user.id, { $set: patch }, { new: true, runValidators: true }).select('-password');
    if (!user) return sendResponse(res, 404, false, 'المستخدم مش موجود.');

    // لو أسطى وباعت بيانات حرفة حدّثها كمان
    const artisanPatch = {};
    ['profession', 'bio', 'experienceYears', 'skills', 'serviceAreas', 'hourlyRate'].forEach((k) => {
      if (value[k] !== undefined) artisanPatch[k] = value[k];
    });
    let artisan = await Artisan.findOne({ userId: user._id });
    if (Object.keys(artisanPatch).length && artisan) {
      artisan = await Artisan.findOneAndUpdate({ userId: user._id }, { $set: artisanPatch }, { new: true, runValidators: true });
    }
    return sendResponse(res, 200, true, 'تم تحديث البيانات بنجاح.', {
      id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
      profileImage: user.profileImage, location: user.location, artisan: artisan || null,
    });
  } catch (error) { next(error); }
};

// DELETE /api/users/me (deactivate account)
const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { isActive: false } });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return sendResponse(res, 200, true, 'تم إلغاء تفعيل حسابك بنجاح.');
  } catch (error) { next(error); }
};

module.exports = { updateMe, deleteMe, getSettings, updateSettings };
