const mongoose = require('mongoose');

const messageAttachmentSchema = new mongoose.Schema({
  attachmentId: {
    type: String,
    required: true,
    unique: true
  },
  messageId: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MessageAttachment', messageAttachmentSchema);
