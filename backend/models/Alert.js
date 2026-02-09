const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    roomName: String,
    type: String, 
    message: String,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Alert', AlertSchema);