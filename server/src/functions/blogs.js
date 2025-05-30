const { app } = require('@azure/functions');
const slugify = require("slugify");
const Blogs = require("../shared/model/blogs.model");
const Analytics = require("../shared/model/analytics.model")
const connectDB = require('../shared/mongoose');
const { cloudinary } = require('../shared/middleware/upload.middleware');

// app.http('createBlog', {
//     methods: ['POST'],
//     authLevel: 'anonymous',
//     route: 'blog/create',
//     handler: async (request, context) => {
//         context.log('HTTP trigger function processed a request: createBlog.');
//         try {
//             await connectDB();
//             const body = await request.json();
//             const { title, content, tags, affiliateLinks, images, video } = body;
//             if (!title || !content) {
//                 return { status: 400, jsonBody: { message: 'Missing required fields: title, content' } };
//             }
//             const blogData = { ...body };
//             blogData.slug = slugify(title, { lower: true, strict: true });

//             if (tags !== undefined) {
//                 blogData.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
//             }
//             if (affiliateLinks !== undefined) {
//                 blogData.affiliateLinks = typeof affiliateLinks === 'string' ? JSON.parse(affiliateLinks) : affiliateLinks;
//             }
//             if (images && Array.isArray(images)) {
//                 blogData.images = images.map(img => ({
//                     url: img.url,
//                     caption: img.caption || '',
//                     public_id: img.public_id
//                 }));
//             }
//             if (video && video.url) {
//                 blogData.video = {
//                     url: video.url,
//                     caption: video.caption || '',
//                     public_id: video.public_id
//                 };
//             }
//             const newBlog = new Blogs(blogData);
//             await newBlog.save();
//             const newAnalytics = new Analytics({
//                 blogId: newBlog._id,
//                 action: "create",
//                 affiliateUrl: null,
//                 revenue: 0,
//                 ip: request.headers.get('x-forwarded-for') || request.ip,
//                 userAgent: request.headers.get('user-agent'),
//                 timestamp: new Date()
//             });
//             await newAnalytics.save();
//             return {
//                 status: 201,
//                 jsonBody: {
//                     code: 201,
//                     message: "Create Blog Successfully",
//                     blogId: newBlog._id
//                 }
//             };
//         } catch (error) {
//             context.log.error('Error creating blog:', error);
//             return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
//         }
//     }
// });

app.http('createBlog', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'blog/create',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: createBlog.');
        try {
            await connectDB();
            const formData = await request.formData();
            const title = formData.get('title');
            const content = formData.get('content');

            if (!title || !content) {
                return { status: 400, jsonBody: { message: 'Missing required fields: title, content' } };
            }
            let uploadedImages = [];
            let uploadedVideo = null;
            const imageFiles = formData.getAll('images');
            const captions = formData.getAll('captions');
            if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
                const uploadPromises = imageFiles.map(file => {
                    return new Promise(async (resolve, reject) => {
                        const buffer = Buffer.from(await file.arrayBuffer());
                        cloudinary.uploader.upload_stream({ folder: "blogs" }, (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }).end(buffer);
                    });
                });
                const uploadResults = await Promise.all(uploadPromises);
                uploadedImages = uploadResults.map((result, index) => ({
                    url: result.secure_url,
                    public_id: result.public_id,
                    caption: captions[index] || ''
                }));
            }

            const videoFile = formData.get('video');
            if (videoFile && videoFile.size > 0) {
                const videoUploadPromise = new Promise(async (resolve, reject) => {
                    const buffer = Buffer.from(await videoFile.arrayBuffer());
                    cloudinary.uploader.upload_stream({ resource_type: 'video', folder: "blogs" }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }).end(buffer);
                });
                const videoResult = await videoUploadPromise;
                uploadedVideo = {
                    url: videoResult.secure_url,
                    public_id: videoResult.public_id,
                    caption: formData.get('video_caption') || ''
                };
            }
            const blogData = {
                title,
                content,
                slug: slugify(title, { lower: true, strict: true }),
                summary: formData.get('summary') || '',
                status: formData.get('status') || 'draft',
                images: uploadedImages,
                video: uploadedVideo,
                tags: formData.has('tags') ? (formData.get('tags')).split(',').map(tag => tag.trim()) : [],
                affiliateLinks: formData.has('affiliateLinks') ? JSON.parse(formData.get('affiliateLinks')) : []
            };

            const newBlog = new Blogs(blogData);
            await newBlog.save();
            const newAnalytics = new Analytics({
                blogId: newBlog._id,
                action: "create",
                affiliateUrl: null,
                revenue: 0,
                ip: request.headers.get('x-forwarded-for') || "unknown",
                userAgent: request.headers.get('user-agent'),
                timestamp: new Date()
            });
            await newAnalytics.save();

            return {
                status: 201,
                jsonBody: {
                    message: "Create Blog Successfully",
                    blogId: newBlog._id
                }
            };

        } catch (error) {
            context.log.error('Error creating blog:', error);
            return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
        }
    }
});

app.http('deleteBlog', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'blog/delete/{id}',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: deleteBlog.');
        try {
            await connectDB();

            const id = request.params.id;
            if (!id) {
                return { status: 400, jsonBody: { message: 'Blog ID is required' } };
            }
            const blog = await Blogs.findById(id);
            if (!blog) {
                return { status: 404, jsonBody: { message: 'Blog not found' } };
            }
            if (blog.images && blog.images.length > 0) {
                for (const img of blog.images) {
                    if (img.public_id) {
                        await cloudinary.uploader.destroy(img.public_id);
                    }
                }
            }
            if (blog.video && blog.video.public_id) {
                await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
            }
            blog.deleted = true;
            blog.status = 'inactive';
            await blog.save();
            await Analytics.deleteMany({ blogId: id });
            await Blogs.findByIdAndDelete(id);
            return {
                status: 200,
                jsonBody: {
                    code: 200,
                    message: 'Blog deleted successfully'
                }
            };
        } catch (error) {
            context.log.error('Error deleting blog:', error);
            return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
        }
    }
});


app.http('updateBlog', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'blog/update/{id}',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: updateBlog.');
        try {
            await connectDB();
            const { id } = request.params;
            const formData = await request.formData();

            const blog = await Blogs.findById(id);
            if (!blog) {
                return { status: 404, jsonBody: { message: 'Blog not found' } };
            }
            const title = formData.get('title');
            if (title) {
                blog.title = title;
                blog.slug = slugify(title, { lower: true, strict: true });
            }
            if (formData.has('content')) blog.content = formData.get('content');
            if (formData.has('summary')) blog.summary = formData.get('summary');
            if (formData.has('status')) blog.status = formData.get('status');

            if (formData.has('tags')) {
                const tagsValue = formData.get('tags');
                blog.tags = (typeof tagsValue === 'string' && tagsValue) ? tagsValue.split(',').map(tag => tag.trim()) : [];
            }
            if (formData.has('affiliateLinks')) {
                blog.affiliateLinks = JSON.parse(formData.get('affiliateLinks'));
            }
            const newImageFiles = formData.getAll('images');
            const captions = formData.getAll('captions');

            if (newImageFiles && newImageFiles.length > 0 && newImageFiles[0].size > 0) {
                if (blog.images && blog.images.length > 0) {
                    const deletePromises = blog.images.map(img =>
                        img.public_id ? cloudinary.uploader.destroy(img.public_id) : Promise.resolve()
                    );
                    await Promise.all(deletePromises);
                }
                const uploadPromises = newImageFiles.map(file => {
                    return new Promise(async (resolve, reject) => {
                        const buffer = Buffer.from(await file.arrayBuffer());
                        cloudinary.uploader.upload_stream({ folder: "blogs" }, (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }).end(buffer);
                    });
                });
                const uploadResults = await Promise.all(uploadPromises);
                blog.images = uploadResults.map((result, index) => ({
                    url: result.secure_url,
                    public_id: result.public_id,
                    caption: captions[index] || ''
                }));
            }
            const newVideoFile = formData.get('video');
            if (newVideoFile && newVideoFile.size > 0) {
                if (blog.video && blog.video.public_id) {
                    await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
                }
                const videoUploadPromise = new Promise(async (resolve, reject) => {
                    const buffer = Buffer.from(await newVideoFile.arrayBuffer());
                    cloudinary.uploader.upload_stream({ resource_type: 'video', folder: "blogs" }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }).end(buffer);
                });
                const videoResult = await videoUploadPromise;
                blog.video = {
                    url: videoResult.secure_url,
                    public_id: videoResult.public_id,
                    caption: formData.get('video_caption') || ''
                };
            }

            await blog.save();
            return {
                status: 200,
                jsonBody: {
                    message: "Update Blog Successfully",
                    blog: blog.toObject()
                }
            };

        } catch (error) {
            context.log.error('Error updating blog:', error);
            return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
        }
    }
});


app.http('getBlog', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'blog/all',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: getBlog.');
        try {
            await connectDB();
            const blogs = await Blogs.find({}).lean();

            if (!blogs || blogs.length === 0) {
                return { status: 404, jsonBody: { message: 'Không có blog nào' } };
            }
            return {
                status: 200,
                jsonBody: {
                    code: 200,
                    blogs,
                    message: "Get All Blog Successfully"
                }
            };
        } catch (error) {
            context.log.error('Error getting all blogs:', error);
            return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
        }
    }
});


app.http('updateBlogStatus', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'update-status/{id}',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: updateBlogStatus.');
        try {
            await connectDB();
            const id = request.params.id;
            if (!id) {
                return { status: 400, jsonBody: { message: 'Blog ID is required' } };
            }
            const status = request.query.get('status');
            if (!['active', 'inactive'].includes(status)) {
                return { status: 400, jsonBody: { message: 'Status không hợp lệ. Chỉ có thể là "active" hoặc "inactive".' } };
            }
            const blog = await Blogs.findById(id);
            if (!blog) {
                return { status: 404, jsonBody: { message: 'Blog không tồn tại' } };
            }
            blog.status = status;
            await blog.save();

            return {
                status: 200,
                jsonBody: {
                    code: 200,
                    message: `Cập nhật status blog thành công`,
                    blog: blog.toObject(),
                },
            };
        } catch (error) {
            context.log.error('Error updating blog status:', error);
            return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
        }
    }
});