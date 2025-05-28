const mongoose = require("mongoose");
const CommentSchema = new mongoose.Schema({
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'blogs' },
    name: String,
    content: String,
}, { versionKey: false, timestamps: true });
module.exports = mongoose.model('Comments', CommentSchema, 'comments');