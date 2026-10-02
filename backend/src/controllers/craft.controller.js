const { sendResponse } = require('../utils/apiResponse');
const Craft = require('../models/Craft');

const list = async (req, res, next) => {
  try {
    const onlyActive = req.query.active !== 'false';
    const query = onlyActive ? { isActive: true } : {};
    const crafts = await Craft.find(query).sort({ name: 1 }).lean();
    return sendResponse(res, 200, true, 'تم جلب الحرف بنجاح.', crafts);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) return sendResponse(res, 400, false, 'الاسم وال slug مطلوبين.');
    const exists = await Craft.findOne({ slug: String(slug).toLowerCase().trim() });
    if (exists) return sendResponse(res, 409, false, 'الحرفة دي موجودة بالفعل.');
    const craft = await Craft.create({
      name: String(name).trim(),
      slug: String(slug).toLowerCase().trim(),
      description: description ? String(description).trim() : '',
      isActive: true,
    });
    return sendResponse(res, 201, true, 'تمت إضافة الحرفة بنجاح.', craft);
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create };
