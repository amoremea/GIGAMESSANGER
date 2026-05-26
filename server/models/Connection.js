const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  userId: String,
  event: String,
  timestamp: Date
});

module.exports = mongoose.model('Connection', connectionSchema);