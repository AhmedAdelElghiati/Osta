const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true, index: true },
    artisanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ artisanId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
