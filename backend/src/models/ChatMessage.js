const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'DirectConversation', index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ jobId: 1, createdAt: 1 });
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.pre('validate', function () {
  if (!!this.jobId === !!this.conversationId) this.invalidate('conversationId', 'Exactly one conversation target is required');
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
