const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    fullName: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    contactType: { type: String, enum: ['business', 'personal', 'company'], default: 'business' },
    subject: { type: String, trim: true, maxlength: 200, default: '' },
    partNumber: { type: String, trim: true, maxlength: 20, default: '' },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    status: { type: String, enum: ['NEW', 'READ', 'RESOLVED'], default: 'NEW', index: true },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
