const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Artisan = require('../models/Artisan');

// PATCH /api/users/me  (customer/artisan updates own basic profile)
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'location', 'profileImage'];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.phone) {
      const clash = await User.findOne({ phone: patch.phone, _id: { $ne: req.user.id } });
      if (clash) return sendResponse(res, 409, false, 'رقم الموبايل ده متسجل قبل كده.');
    }
    if (patch.name && String(patch.name).trim().length < 2) return sendResponse(res, 400, false, 'الاسم قصير أوي.');
    const user = await User.findByIdAndUpdate(req.user.id, { $set: patch }, { new: true }).select('-password');
    if (!user) return sendResponse(res, 404, false, 'المستخدم مش موجود.');

    // لو أسطى وباعت بيانات حرفة حدّثها كمان
    const artisanPatch = {};
    ['profession', 'bio', 'experienceYears', 'skills', 'serviceAreas', 'hourlyRate'].forEach((k) => {
      if (req.body[k] !== undefined) artisanPatch[k] = req.body[k];
    });
    let artisan = await Artisan.findOne({ userId: user._id });
    if (Object.keys(artisanPatch).length && artisan) {
      artisan = await Artisan.findOneAndUpdate({ userId: user._id }, { $set: artisanPatch }, { new: true });
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

module.exports = { updateMe, deleteMe };
