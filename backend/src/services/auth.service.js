const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Session = require('../models/Session');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const safeUserData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  profileImage: user.profileImage,
  location: user.location,
  isActive: user.isActive,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const issueTokens = async ({ user, userAgent = '', ipAddress = '', res }) => {
  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const session = await Session.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent,
    ipAddress,
  });

  if (res) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return {
    accessToken,
    refreshToken,
    session,
    user: safeUserData(user),
  };
};

const registerUser = async ({ data, req }) => {
  const { name, email, phone, password, role, location, profession, bio, experienceYears, skills, serviceAreas, hourlyRate } = data;

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    const error = new Error('Phone already registered');
    error.statusCode = 409;
    throw error;
  }

  if (role === 'admin') {
    const error = new Error('Public registration cannot create admin accounts');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role,
    location,
    emailVerified: false,
  });

  let artisanProfile = null;
  if (role === 'artisan') {
    artisanProfile = await Artisan.create({
      userId: user._id,
      profession,
      bio,
      experienceYears,
      skills,
      serviceAreas,
      hourlyRate,
    });
  }

  return {
    user: safeUserData(user),
    artisan: artisanProfile ? artisanProfile.toObject() : null,
  };
};

const loginUser = async ({ email, password, userAgent, ipAddress, res }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is inactive');
    error.statusCode = 401;
    throw error;
  }

  const tokens = await issueTokens({ user, userAgent, ipAddress, res });
  return tokens;
};

const refreshTokenService = async ({ refreshToken, userAgent = '', ipAddress = '' }) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    const refreshError = new Error('Invalid or expired refresh token');
    refreshError.statusCode = 401;
    throw refreshError;
  }

  if (!decoded || !decoded.userId) {
    const error = new Error('Invalid refresh token payload');
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const session = await Session.findOne({
    userId: decoded.userId,
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate('userId');

  if (!session || !session.userId) {
    const error = new Error('Refresh token session not found or revoked');
    error.statusCode = 401;
    throw error;
  }

  if (!session.userId.isActive) {
    const error = new Error('User account is inactive');
    error.statusCode = 401;
    throw error;
  }

  session.revokedAt = new Date();
  await session.save();

  const user = session.userId;
  const tokens = await issueTokens({ user, userAgent, ipAddress });

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: safeUserData(user) };
};

const logoutUser = async ({ refreshToken, userId, res }) => {
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await Session.updateMany({ userId, tokenHash }, { revokedAt: new Date() });
  }

  if (userId) {
    await Session.updateMany({ userId }, { revokedAt: new Date() });
  }

  if (res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  return true;
};

const logoutAllDevices = async ({ userId, res }) => {
  await Session.updateMany({ userId }, { revokedAt: new Date() });

  if (res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  return true;
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const artisan = await Artisan.findOne({ userId: user._id });
  return {
    ...safeUserData(user),
    artisan: artisan ? artisan.toObject() : null,
  };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  await Session.updateMany({ userId }, { revokedAt: new Date() });
  return true;
};

const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return false;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  user.resetPasswordTokenHash = hash;
  user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return { token, email: user.email };
};

const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  await Session.updateMany({ userId: user._id }, { revokedAt: new Date() });
  return true;
};

const verifyEmail = async ({ token }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    const error = new Error('Invalid or expired verification token');
    error.statusCode = 400;
    throw error;
  }

  user.emailVerified = true;
  user.verificationTokenHash = null;
  user.verificationTokenExpiresAt = null;
  await user.save();

  return true;
};

const seedAdmin = async ({ name, email, phone, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error('Admin already exists');
  }

  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role: 'admin',
    emailVerified: true,
  });

  return safeUserData(admin);
};

module.exports = {
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
  seedAdmin,
};
