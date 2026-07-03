const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  socketId: {
    type: String,
    required: true
  },
  jwtToken: {
    type: String,
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserSession', userSessionSchema);
