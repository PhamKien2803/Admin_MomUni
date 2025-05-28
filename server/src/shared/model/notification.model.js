const mongoose = require("mongoose");
const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    expertFormId: { type: mongoose.Schema.Types.ObjectId, ref: 'expertForms' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }, { versionKey: false });
  
  module.exports = mongoose.model('Notification', NotificationSchema, 'notifications');