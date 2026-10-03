const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ['customer', 'artisan', 'admin'],
      default: 'customer',
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    settings: {
      notifications: {
        requests: { type: Boolean, default: true },
        offers: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        updates: { type: Boolean, default: true },
      },
      addresses: [{
        id: { type: String, required: true },
        title: { type: String, required: true, maxlength: 100 },
        address: { type: String, required: true, maxlength: 500 },
      }],
      paymentMethods: [{
        id: { type: String, required: true },
        type: { type: String, required: true, maxlength: 50 },
        lastFour: { type: String, required: true, maxlength: 4 },
        details: { type: String, required: true, maxlength: 100 },
        icon: { type: String, enum: ['bi-phone', 'bi-credit-card'], required: true },
      }],
      payout: {
        provider: { type: String, default: '', maxlength: 100 },
        number: { type: String, default: '', maxlength: 50 },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    withdrawalLockUntil: { type: Date, default: null, select: false },
    verificationTokenHash: {
      type: String,
      default: null,
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: null,
    },
    resetPasswordTokenHash: {
      type: String,
      default: null,
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.verificationTokenHash;
        delete ret.resetPasswordTokenHash;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return require('../utils/password').comparePassword(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
