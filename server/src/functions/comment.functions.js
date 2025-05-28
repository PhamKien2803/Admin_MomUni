const { app } = require('@azure/functions');
const connectDB = require('../shared/mongoose');
const mongoose = require('mongoose');
const Comment = require('../shared/model/comment.model');
const Blogs = require('../shared/model/blogs.model');

app.http('createComment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'comments/user-comment',
    handler: async (request, context) => {
        try {
            await connectDB();
            const { blogId, name, content } = await request.json();

            if (!blogId || !name || !content) {
                return { status: 400, jsonBody: { message: 'Vui lòng cung cấp đầy đủ blogId, name và content' } };
            }

            if (!mongoose.Types.ObjectId.isValid(blogId)) {
                return { status: 400, jsonBody: { message: 'blogId không hợp lệ' } };
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

            return {
                status: 201,
                jsonBody: {
                    message: 'Comment đã được tạo thành công',
                    comment: savedComment,
                }
            };
        } catch (error) {
            context.log.error('Lỗi khi tạo comment:', error);
            return { status: 500, jsonBody: { message: 'Lỗi server, vui lòng thử lại sau' } };
        }
    }
});

app.http('getComments', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'comments',
    handler: async (request, context) => {
        try {
            await connectDB();
            const blogId = request.query.get('blogId');
            const page = request.query.get('page') || '1';
            const limit = request.query.get('limit') || '10';

            const query = blogId ? { blogId } : {};

            if (blogId && !mongoose.Types.ObjectId.isValid(blogId)) {
                return { status: 400, jsonBody: { message: 'blogId không hợp lệ' } };
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

            return {
                status: 200,
                jsonBody: {
                    message: 'Lấy danh sách comment thành công',
                    comments,
                    pagination: {
                        total: totalComments,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(totalComments / limitNum),
                    },
                }
            };
        } catch (error) {
            context.log.error('Lỗi khi lấy comment:', error);
            return { status: 500, jsonBody: { message: 'Lỗi server, vui lòng thử lại sau' } };
        }
    }
});