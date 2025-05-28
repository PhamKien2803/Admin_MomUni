const mongoose = require('mongoose');
const Rating = require('../../model/rating.model');
const Blogs = require('../../model/blogs.model');

module.exports.getRatings = async (req, res) => {
    try {
        const { blogId, page = 1, limit = 10 } = req.query;

        const query = blogId ? { blogId } : {};

        if (blogId && !mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: 'blogId không hợp lệ' });
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ message: 'Page và limit phải lớn hơn 0' });
        }

        const skip = (pageNum - 1) * limitNum;

        const ratings = await Rating.find(query)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 })
            .lean();

        const totalRatings = await Rating.countDocuments(query);

        const averageRatingResult = await Rating.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    average: { $avg: '$rating' }
                }
            }
        ]);

        const averageRating = averageRatingResult.length > 0 ? Number(averageRatingResult[0].average.toFixed(2)) : 0;

        if (blogId) {
            const blog = await Blogs.findById(blogId);
            if (!blog) {
                return res.status(404).json({ message: 'Blog không tồn tại' });
            }

            await Blogs.findByIdAndUpdate(
                blogId,
                { $set: { averageRating } },
                { new: true }
            );
        }

        res.status(200).json({
            message: 'Lấy danh sách rating thành công',
            ratings,
            averageRating,
            pagination: {
                total: totalRatings,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalRatings / limitNum),
            },
        });
    } catch (error) {
        console.error('Lỗi khi lấy rating:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }
};

module.exports.createRating = async (req, res) => {
    try {
        const { blogId, rating } = req.body;

        if (!blogId || !rating) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ blogId và rating' });
        }

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: 'blogId không hợp lệ' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating phải nằm trong khoảng từ 1 đến 5' });
        }

        const blog = await Blogs.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog không tồn tại' });
        }
        const newRating = new Rating({
            blogId,
            rating,
        });

        const savedRating = await newRating.save();

        const ratingStats = await Rating.aggregate([
            { $match: { blogId: new mongoose.Types.ObjectId(blogId) } },
            {
                $group: {
                    _id: null,
                    average: { $avg: '$rating' }
                }
            }
        ]);

        const averageRating = ratingStats.length > 0 ? Number(ratingStats[0].average.toFixed(2)) : 0;

        await Blogs.findByIdAndUpdate(
            blogId,
            { $set: { averageRating } },
            { new: true }
        );

        res.status(201).json({
            message: 'Rating đã được tạo thành công',
            rating: savedRating,
        });
    } catch (error) {
        console.error('Lỗi khi tạo rating:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }
};