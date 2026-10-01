const mongoose = require('mongoose');
const { EVENT_TYPES } = require('../modules/serviceRequests.constants');

const requestEventSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: EVENT_TYPES },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

requestEventSchema.index({ requestId: 1, createdAt: 1 });

module.exports = mongoose.model('RequestEvent', requestEventSchema);
