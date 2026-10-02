const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    artisanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true, index: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
      default: 'NOT_STARTED',
      index: true,
    },
    deliveryStatus: { type: String, enum: ['PENDING', 'SUBMITTED', 'APPROVED'], default: 'PENDING' },
    paymentStatus: { type: String, enum: ['ESCROWED', 'RELEASED', 'REFUNDED'], default: 'ESCROWED' },
    startedAt: { type: Date },
    expectedCompletion: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ artisanId: 1, status: 1, createdAt: -1 });
jobSchema.index({ customerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);