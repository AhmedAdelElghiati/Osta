const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artisanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
schema.index({ customerId: 1, artisanId: 1 }, { unique: true });
module.exports = mongoose.model('DirectConversation', schema);
