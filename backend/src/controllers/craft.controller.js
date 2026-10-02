const { sendResponse } = require('../utils/apiResponse');
const Craft = require('../models/Craft');
const { listCrafts } = require('../services/craftCatalog.service');

const list = async (req, res, next) => {
  try {
    const onlyActive = req.query.active !== 'false';
    const crafts = await listCrafts(onlyActive);
    return sendResponse(res, 200, true, 'تم جلب الحرف بنجاح.', crafts);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) return sendResponse(res, 400, false, 'الاسم والـ slug مطلوبين.');
    const normalizedSlug = String(slug).toLowerCase().trim();
    const exists = await Craft.findOne({ slug: normalizedSlug });
    if (exists) return sendResponse(res, 409, false, 'الحرفة دي موجودة بالفعل.');
    const craft = await Craft.create({
      name: String(name).trim(),
      slug: normalizedSlug,
      description: description ? String(description).trim() : '',
      isActive: true,
    });
    return sendResponse(res, 201, true, 'تمت إضافة الحرفة بنجاح.', craft);
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create };
