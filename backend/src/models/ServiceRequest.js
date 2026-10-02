const mongoose = require('mongoose');
const { REQUEST_STATUSES, RECEIVE_MODES } = require('../modules/serviceRequests.constants');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
  },
  { _id: true }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    craftId: { type: String, ref: 'Craft', required: true, index: true },
    location: {
      city: { type: String, required: true, trim: true, maxlength: 100 },
      area: { type: String, required: true, trim: true, maxlength: 100 },
      address: { type: String, required: true, trim: true, maxlength: 300 },
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    preferredDate: { type: Date },
    preferredTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, default: 'EGP', enum: ['EGP'] },
    },
    receiveMode: { type: String, required: true, enum: RECEIVE_MODES, default: 'OFFERS' },
    images: { type: [imageSchema], default: [] },
    status: { type: String, required: true, enum: REQUEST_STATUSES, default: 'DRAFT', index: true },
    publishedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ customerId: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ customerId: 1, createdAt: -1 });
serviceRequestSchema.index({ craftId: 1, status: 1 });
serviceRequestSchema.index({ customerId: 1, title: 'text', description: 'text' });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
