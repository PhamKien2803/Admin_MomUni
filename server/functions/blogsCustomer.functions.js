const { app } = require('@azure/functions');
const connectDB = require('../shared/mongoose');
const Blogs = require('../shared/model/blogs.model');


// API: GET /api/blog/{slug}
app.http('getBlogBySlug', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'blog/{slug}',
    handler: async (request, context) => {
        try {
            await connectDB();
            const { slug } = request.params;

            const blog = await Blogs.findOne({
                slug: slug,
                status: 'active',
                deleted: false
            }).lean();

            if (!blog) {
                return {
                    status: 404,
                    jsonBody: { message: 'Blog không tồn tại hoặc đã bị xóa' }
                };
            }
            await Blogs.findOneAndUpdate({ slug: slug }, { $inc: { viewCount: 1 } });
            return {
                status: 200,
                jsonBody: {
                    message: 'Lấy thông tin blog thành công',
                    blog,
                }
            };
        } catch (error) {
            context.log.error('Lỗi khi lấy blog:', error.message);
            return {
                status: 500,
                jsonBody: { message: 'Lỗi server, vui lòng thử lại sau' }
            };
        }
    }
});

// API: GET /api/blog
app.http('getAllBlogs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'blog',
    handler: async (request, context) => {
        try {
            await connectDB();
            const blogs = await Blogs.find({
                status: 'active',
                deleted: false
            }).sort({ createdAt: -1 }).lean();
            if (blogs.length === 0) {
                return {
                    status: 404,
                    jsonBody: { message: 'Không có blog nào' }
                };
            }

            return {
                status: 200,
                jsonBody: {
                    message: 'Lấy danh sách blog thành công',
                    blogs,
                }
            };
        } catch (error) {
            context.log.error('Lỗi khi lấy danh sách blog:', error.message);
            return {
                status: 500,
                jsonBody: { message: 'Lỗi server, vui lòng thử lại sau' }
            };
        }
    }
});