const Joi = require('joi');

const roleEnum = ['customer', 'artisan'];

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/).required().messages({
    'string.pattern.base': 'Password must contain at least 8 characters, including uppercase, lowercase, number, and symbol.',
  }),
  role: Joi.string().valid(...roleEnum).required(),
  profession: Joi.string().trim().when('role', {
    is: 'artisan',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  bio: Joi.string().trim().max(1000).optional(),
  experienceYears: Joi.number().min(0).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  serviceAreas: Joi.array().items(Joi.string()).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  location: Joi.string().trim().max(200).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/).required().messages({
    'string.pattern.base': 'Password must contain at least 8 characters, including uppercase, lowercase, number, and symbol.',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/).required().messages({
    'string.pattern.base': 'Password must contain at least 8 characters, including uppercase, lowercase, number, and symbol.',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
