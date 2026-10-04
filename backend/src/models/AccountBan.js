const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  reason: { type: String, required: true, maxlength: 1000 },
  bannedBy: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('AccountBan', schema);
