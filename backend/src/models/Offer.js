const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    artisanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, trim: true, maxlength: 100, default: '' },
    warranty: { type: String, trim: true, maxlength: 100, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    items: { type: [quoteItemSchema], default: [] },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

offerSchema.index({ requestId: 1, artisanId: 1, status: 1 });
offerSchema.index({ artisanId: 1, createdAt: -1 });
offerSchema.index({ requestId: 1, createdAt: -1 });

module.exports = mongoose.model('Offer', offerSchema);
