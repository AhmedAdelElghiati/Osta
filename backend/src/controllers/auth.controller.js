const { sendResponse } = require('../utils/apiResponse');
const {
  registerUser,
  loginUser,
  refreshTokenService,
  logoutUser,
  logoutAllDevices,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await registerUser({ data: req.body, req });
    return sendResponse(res, 201, true, 'Registration successful', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser({
      email: req.body.email,
      password: req.body.password,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip,
      res,
    });

    return sendResponse(res, 200, true, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken || null;
    await logoutUser({
      refreshToken,
      userId: req.user ? req.user.id : null,
      res,
    });

    return sendResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await logoutAllDevices({ userId: req.user.id, res });
    return sendResponse(res, 200, true, 'Logged out from all devices successfully');
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);
    return sendResponse(res, 200, true, 'User profile fetched', user);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await refreshTokenService({
      refreshToken,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip,
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendResponse(res, 200, true, 'Token refreshed successfully', {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const changePasswordController = async (req, res, next) => {
  try {
    await changePassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return sendResponse(res, 200, true, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    const result = await forgotPassword({ email: req.body.email });
    if (!result) {
      return sendResponse(res, 200, true, 'If the email exists, a password reset link has been sent');
    }

    return sendResponse(res, 200, true, 'If the email exists, a password reset link has been sent', { email: result.email });
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    await resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
    return sendResponse(res, 200, true, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

const verifyEmailController = async (req, res, next) => {
  try {
    await verifyEmail({ token: req.body.token });
    return sendResponse(res, 200, true, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
};
