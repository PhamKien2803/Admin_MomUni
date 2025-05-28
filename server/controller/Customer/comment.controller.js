const mongoose = require('mongoose');
const Comment = require('../../model/comment.model');
const Blogs = require('../../model/blogs.model');

module.exports.createComment = async (req, res) => {
    try {
        const { blogId, name, content } = req.body;

        if (!blogId || !name || !content) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ blogId, name và content' });
        }

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: 'blogId không hợp lệ' });
        }

        const newComment = new Comment({
            blogId,
            name,
            content,
        });
        await Blogs.findByIdAndUpdate(
            blogId,
            { $inc: { commentCount: 1 } },
            { new: true }
        );

        const savedComment = await newComment.save();

        res.status(201).json({
            message: 'Comment đã được tạo thành công',
            comment: savedComment,
        });
    } catch (error) {
        console.error('Lỗi khi tạo comment:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }
};

module.exports.getComments = async (req, res) => {
    try {
        const { blogId, page = 1, limit = 10 } = req.query;

        const query = blogId ? { blogId } : {};

        if (blogId && !mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: 'blogId không hợp lệ' });
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const skip = (pageNum - 1) * limitNum;

        const comments = await Comment.find(query)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 })
            .lean();

        const totalComments = await Comment.countDocuments(query);

        res.status(200).json({
            message: 'Lấy danh sách comment thành công',
            comments,
            pagination: {
                total: totalComments,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalComments / limitNum),
            },
        });
    } catch (error) {
        console.error('Lỗi khi lấy comment:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }
};