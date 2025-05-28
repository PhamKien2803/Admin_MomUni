const { app } = require('@azure/functions');
const mongoose = require('mongoose');
const connectDB = require('../shared/mongoose');
const Rating = require('../shared/model/rating.model');
const Blogs = require('../shared/model/blogs.model');

app.http('getRatings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'ratings',
    handler: async (request, context) => {
        try {
            await connectDB();
            const blogId = request.query.get('blogId');
            const page = request.query.get('page') || '1';
            const limit = request.query.get('limit') || '10';

            const query = blogId ? { blogId: new mongoose.Types.ObjectId(blogId) } : {};

            if (blogId && !mongoose.Types.ObjectId.isValid(blogId)) {
                return { status: 400, jsonBody: { message: 'blogId không hợp lệ' } };
            }

            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            if (pageNum < 1 || limitNum < 1) {
                return { status: 400, jsonBody: { message: 'Page và limit phải lớn hơn 0' } };
            }

            const skip = (pageNum - 1) * limitNum;
            const ratings = await Rating.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }).lean();
            const totalRatings = await Rating.countDocuments(query);

            const averageRatingResult = await Rating.aggregate([
                { $match: query },
                { $group: { _id: null, average: { $avg: '$rating' } } }
            ]);

            const averageRating = averageRatingResult.length > 0 ? Number(averageRatingResult[0].average.toFixed(2)) : 0;

            if (blogId) {
                const blog = await Blogs.findById(blogId);
                if (!blog) {
                    return { status: 404, jsonBody: { message: 'Blog không tồn tại' } };
                }
                await Blogs.findByIdAndUpdate(blogId, { $set: { averageRating } }, { new: true });
            }

            return {
                status: 200,
                jsonBody: {
                    message: 'Lấy danh sách rating thành công',
                    ratings,
                    averageRating,
                    pagination: {
                        total: totalRatings,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(totalRatings / limitNum),
                    },
                }
            };
        } catch (error) {
            context.log.error('Lỗi khi lấy rating:', error);
            return { status: 500, jsonBody: { message: 'Lỗi server, vui lòng thử lại sau' } };
        }
    }
});

app.http('createRating', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'ratings/user-rating',
    handler: async (request, context) => {
        try {
            await connectDB();
            const { blogId, rating } = await request.json();

            if (!blogId || rating === undefined) {
                return { status: 400, jsonBody: { message: 'Vui lòng cung cấp đầy đủ blogId và rating' } };
            }

            if (!mongoose.Types.ObjectId.isValid(blogId)) {
                return { status: 400, jsonBody: { message: 'blogId không hợp lệ' } };
            }

            const numericRating = Number(rating);
            if (numericRating < 1 || numericRating > 5) {
                return { status: 400, jsonBody: { message: 'Rating phải nằm trong khoảng từ 1 đến 5' } };
            }

            const blog = await Blogs.findById(blogId);
            if (!blog) {
                return { status: 404, jsonBody: { message: 'Blog không tồn tại' } };
            }

            const newRating = new Rating({ blogId, rating: numericRating });
            const savedRating = await newRating.save();

            const ratingStats = await Rating.aggregate([
                { $match: { blogId: new mongoose.Types.ObjectId(blogId) } },
                { $group: { _id: null, average: { $avg: '$rating' } } }
            ]);

            const averageRating = ratingStats.length > 0 ? Number(ratingStats[0].average.toFixed(2)) : 0;
            await Blogs.findByIdAndUpdate(blogId, { $set: { averageRating } }, { new: true });

            return {
                status: 201,
                jsonBody: {
                    message: 'Rating đã được tạo thành công',
                    rating: savedRating,
                }
            };
        } catch (error) {
            context.log.error('Lỗi khi tạo rating:', error);
            return { status: 500, jsonBody: { message: 'Lỗi server, vui lòng thử lại sau' } };
        }
    }
});