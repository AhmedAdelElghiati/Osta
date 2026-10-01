const { sendResponse } = require('../utils/apiResponse');
const service = require('../services/serviceRequest.service');
const { createRequestSchema, updateRequestSchema, listQuerySchema, cancelRequestSchema } = require('../validators/serviceRequest.validators');

const validate = (schema, value) => schema.validate(value, { abortEarly: false, convert: true });
const validationError = (res, error) => sendResponse(res, 400, false, error.details.map((item) => item.message).join(' '));

const create = async (req, res, next) => {
  try { const result = validate(createRequestSchema, req.body); if (result.error) return validationError(res, result.error); const data = await service.createRequest(req.user.id, result.value); return sendResponse(res, 201, true, 'تم حفظ الطلب كمسودة بنجاح.', data); } catch (error) { next(error); }
};
const list = async (req, res, next) => {
  try { const result = validate(listQuerySchema, req.query); if (result.error) return validationError(res, result.error); return sendResponse(res, 200, true, 'تم جلب الطلبات بنجاح.', await service.listRequests(req.user.id, result.value)); } catch (error) { next(error); }
};
const get = async (req, res, next) => { try { return sendResponse(res, 200, true, 'تم جلب الطلب بنجاح.', await service.getRequest(req.params.id, req.user.id)); } catch (error) { next(error); } };
const update = async (req, res, next) => { try { const result = validate(updateRequestSchema, req.body); if (result.error) return validationError(res, result.error); return sendResponse(res, 200, true, 'تم تعديل الطلب بنجاح.', await service.updateRequest(req.params.id, req.user.id, result.value)); } catch (error) { next(error); } };
const publish = async (req, res, next) => { try { return sendResponse(res, 200, true, 'الطلب اتنشر بنجاح.', await service.publishRequest(req.params.id, req.user.id)); } catch (error) { next(error); } };
const cancel = async (req, res, next) => { try { const result = validate(cancelRequestSchema, req.body); if (result.error) return validationError(res, result.error); return sendResponse(res, 200, true, 'تم إلغاء الطلب بنجاح.', await service.cancelRequest(req.params.id, req.user.id, result.value.reason)); } catch (error) { next(error); } };
const republish = async (req, res, next) => { try { return sendResponse(res, 200, true, 'الطلب اتنشر تاني بنجاح.', await service.republishRequest(req.params.id, req.user.id)); } catch (error) { next(error); } };
const timeline = async (req, res, next) => { try { return sendResponse(res, 200, true, 'تم جلب خط زمني للطلب.', await service.getTimeline(req.params.id, req.user.id)); } catch (error) { next(error); } };
const images = async (req, res, next) => { try { if (!req.files?.length) return sendResponse(res, 400, false, 'من فضلك اختار صورة واحدة على الأقل.'); return sendResponse(res, 201, true, 'تمت إضافة الصور بنجاح.', await service.addImages(req.params.id, req.user.id, req.files)); } catch (error) { next(error); } };
const deleteImage = async (req, res, next) => { try { return sendResponse(res, 200, true, 'تم حذف الصورة بنجاح.', await service.deleteImage(req.params.id, req.user.id, req.params.imageId)); } catch (error) { next(error); } };

module.exports = { create, list, get, update, publish, cancel, republish, timeline, images, deleteImage };
