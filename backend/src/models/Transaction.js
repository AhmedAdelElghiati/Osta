const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'payment', 'escrow_hold', 'escrow_release', 'refund'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
