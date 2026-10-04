const Joi = require('joi');
const mongoose = require('mongoose');
const { REQUEST_STATUSES, RECEIVE_MODES } = require('../modules/serviceRequests.constants');

const craftRef = Joi.string().trim().custom((value, helpers) => {
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return value;
  return helpers.error('any.invalid');
}, 'Craft ObjectId or slug');

const location = Joi.object({
  city: Joi.string().trim().min(2).max(100).required().messages({ 'any.required': 'من فضلك اكتب المحافظة.' }),
  area: Joi.string().trim().min(2).max(100).required().messages({ 'any.required': 'من فضلك اكتب المنطقة.' }),
  address: Joi.string().trim().min(5).max(300).required().messages({ 'any.required': 'من فضلك اكتب العنوان بالتفصيل.' }),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
}).required();

const budget = Joi.object({
  min: Joi.number().min(0).required(),
  max: Joi.number().min(Joi.ref('min')).required(),
  currency: Joi.string().valid('EGP').default('EGP'),
}).required().messages({ '*': 'الميزانية غير صحيحة.' });

const preferredDate = Joi.date().iso().min('now').optional().messages({
  'date.min': 'التاريخ المطلوب لازم يكون في المستقبل.',
  'date.format': 'التاريخ المطلوب غير صحيح.',
});

const requestFields = {
  title: Joi.string().trim().min(3).max(200).required().messages({ 'any.required': 'من فضلك اكتب عنوان الطلب.', 'string.empty': 'من فضلك اكتب عنوان الطلب.', 'string.min': 'عنوان الطلب لازم يكون 3 حروف على الأقل.', 'string.max': 'عنوان الطلب لا يتجاوز 200 حرف.' }),
  description: Joi.string().trim().min(10).max(5000).required().messages({ 'any.required': 'من فضلك اكتب تفاصيل الطلب.', 'string.empty': 'من فضلك اكتب تفاصيل الطلب.', 'string.min': 'تفاصيل الطلب لازم تكون 10 حروف على الأقل.', 'string.max': 'تفاصيل الطلب لا تتجاوز 5000 حرف.' }),
  craftId: craftRef.required().messages({ 'any.required': 'من فضلك اختار نوع الخدمة.', 'any.invalid': 'نوع الخدمة غير صحيح.' }),
  location,
  preferredDate,
  preferredTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional().messages({ 'string.pattern.base': 'الوقت المطلوب غير صحيح.' }),
  budget,
  receiveMode: Joi.string().valid(...RECEIVE_MODES).default('OFFERS'),
};

const createRequestSchema = Joi.object(requestFields).unknown(false);
const updateRequestSchema = Joi.object({
  title: requestFields.title.optional(),
  description: requestFields.description.optional(),
  craftId: requestFields.craftId.optional(),
  location: requestFields.location.optional(),
  preferredDate,
  preferredTime: requestFields.preferredTime,
  budget: requestFields.budget,
  receiveMode: requestFields.receiveMode,
}).min(1).unknown(false);

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...REQUEST_STATUSES),
  craftId: craftRef,
  search: Joi.string().trim().max(100),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}).unknown(false);

const cancelRequestSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required().messages({ 'any.required': 'من فضلك اكتب سبب إلغاء الطلب.' }),
}).unknown(false);

module.exports = { createRequestSchema, updateRequestSchema, listQuerySchema, cancelRequestSchema };
