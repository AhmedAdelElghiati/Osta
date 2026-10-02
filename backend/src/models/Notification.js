const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../modules/notification.constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    details: { type: String, trim: true, maxlength: 500, default: '' },
    icon: { type: String, trim: true, default: 'bi-bell' },
    link: { type: String, trim: true, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES || {}).length ? Object.values(NOTIFICATION_TYPES) : ['INFO', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'MESSAGE_RECEIVED'], default: 'INFO' },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
