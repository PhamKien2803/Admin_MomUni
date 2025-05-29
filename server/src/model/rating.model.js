const mongoose = require("mongoose");
const RatingSchema = new mongoose.Schema({
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'blogs' },
    rating: { type: Number, min: 1, max: 5 },
}, { versionKey: false, timestamps: true });
module.exports = mongoose.model('Ratings', RatingSchema, 'ratings');