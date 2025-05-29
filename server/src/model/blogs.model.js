const { default: mongoose } = require("mongoose");

const BlogsSchema = new mongoose.Schema({
    title: String,
    slug: String,
    content: String,
    summary: String,
    tags: [String],
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    // authorId: {
    //     type: String,
    //     enum: ["Admin", "Chuyên Gia"],
    //     required: true,
    //     default: "Chuyên Gia",
    // },
    affiliateLinks: [
        {
            label: String,
            url: String,
            clickCount: { type: Number, default: 0 }
        }
    ],
    images: [
        {
            url: String,
            caption: String,
            public_id: String,
        }
    ],
    video: {
        url: String,
        caption: String,
        public_id: String
    },
    viewCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    deleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
})

const Blogs = mongoose.model('Blogs', BlogsSchema, 'blogs');

module.exports = Blogs;