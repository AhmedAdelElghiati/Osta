const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, logout, logoutAll, me, refresh, changePasswordController, forgotPasswordController, resetPasswordController, verifyEmailController } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../validators/auth.validators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  req.body = value;
  next();
};

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, me);
router.post('/refresh', validate(refreshSchema), refresh);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePasswordController);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPasswordController);
router.post('/verify-email', authLimiter, validate({ token: require('joi').string().required() }), verifyEmailController);

module.exports = router;
