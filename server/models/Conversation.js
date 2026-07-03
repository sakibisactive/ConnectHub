const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['individual', 'group'],
    required: true
  },
  participants: [{
    type: String, // store userId strings
    required: true,
    index: true
  }],
  groupName: {
    type: String,
    default: ''
  },
  groupAdmin: {
    type: String, // userId of group admin
    default: null
  },
  groupAvatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);
