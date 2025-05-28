const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'blogs' },
    action: { type: String, enum: ['view', 'click', 'form_submit', 'purchase', 'visit', 'create'], required: true },
    affiliateUrl: String,
    revenue: Number,
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model("Analytics", AnalyticsSchema, "analytics");
