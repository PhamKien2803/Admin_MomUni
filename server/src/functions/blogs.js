const { app } = require('@azure/functions');
const slugify = require("slugify");
const Blogs = require("../shared/model/blogs.model");
const Analytics = require("../shared/model/analytics.model")
const connectDB = require('../shared/mongoose');
const mongoose = require("mongoose");
const { cloudinary, uploadBufferToCloudinary } = require('../shared/middleware/upload.middleware');


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
                return { status: 400, jsonBody: { message: 'Thiếu các trường bắt buộc: title, content' } };
            }

            const summary = formData.get('summary');
            const status = formData.get('status');
            // const tags = formData.get('tags');
            const tagsRaw = formData.get('tags');
            const affiliateLinks = formData.get('affiliateLinks');
            const headings = formData.get('headings');
            const newBlogData = {
                title,
                content,
                summary: summary || '',
                status: status || 'inactive',
                slug: slugify(title, { lower: true, strict: true })
            };
            let parsedTags = [];
            if (tagsRaw) {
                try {
                    const parsed = JSON.parse(tagsRaw);
                    if (!Array.isArray(parsed)) {
                        return { status: 400, jsonBody: { message: 'Tags phải là một mảng' } };
                    }
                    parsedTags = parsed.map(tag => String(tag).trim()).filter(t => t.length > 0);
                } catch (err) {
                    return { status: 400, jsonBody: { message: 'Định dạng tags không hợp lệ (phải là JSON array)' } };
                }
            }


            if (affiliateLinks && typeof affiliateLinks === 'string') {
                try {
                    const parsed = JSON.parse(affiliateLinks);
                    if (Array.isArray(parsed)) {
                        newBlogData.affiliateLinks = parsed.map(link => ({
                            label: link.label || '',
                            url: link.url || '',
                            image: link.image || ''
                        }));
                    } else {
                        newBlogData.affiliateLinks = [];
                    }
                } catch (e) {
                    return { status: 400, jsonBody: { message: 'Định dạng JSON của affiliateLinks không hợp lệ.' } };
                }
            } else {
                newBlogData.affiliateLinks = [];
            }

            if (headings && typeof headings === 'string') {
                try {
                    newBlogData.headings = JSON.parse(headings);
                } catch (e) {
                    return { status: 400, jsonBody: { message: 'Định dạng JSON của headings không hợp lệ.' } };
                }
            } else {
                newBlogData.headings = [];
            }
            const imageFiles = formData.getAll('newImages');
            const captions = formData.getAll('newImageCaptions');
            newBlogData.images = [];

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
                newBlogData.images = uploadResults.map((result, index) => ({
                    url: result.secure_url,
                    public_id: result.public_id,
                    caption: captions[index] || ''
                }));
            }
            const videoFile = formData.get('newVideo');
            const videoCaption = formData.get('newVideoCaption');
            newBlogData.video = null;

            if (videoFile && videoFile.size > 0) {
                const videoUploadPromise = new Promise(async (resolve, reject) => {
                    const buffer = Buffer.from(await videoFile.arrayBuffer());
                    cloudinary.uploader.upload_stream({ resource_type: 'video', folder: "blogs" }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }).end(buffer);
                });
                const videoResult = await videoUploadPromise;
                newBlogData.video = {
                    url: videoResult.secure_url,
                    public_id: videoResult.public_id,
                    caption: videoCaption || ''
                };
            }
            const newBlog = new Blogs(newBlogData);
            await newBlog.save();
            const newAnalytics = new Analytics({
                blogId: newBlog._id,
                action: "create",
                ip: request.headers.get('x-forwarded-for') || "unknown",
                userAgent: request.headers.get('user-agent') || "unknown",
                timestamp: new Date()
            });
            await newAnalytics.save();

            return {
                status: 201,
                jsonBody: {
                    message: "Tạo bài viết mới thành công!",
                    blog: newBlog
                }
            };

        } catch (error) {
            context.log('Error creating blog:', error);
            return { status: 500, jsonBody: { message: 'Lỗi máy chủ nội bộ', error: error.message } };
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
            context.log('Error deleting blog:', error);
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
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { status: 400, jsonBody: { message: 'ID bài viết không hợp lệ' } };
            }

            const blog = await Blogs.findById(id);
            if (!blog) {
                return { status: 404, jsonBody: { message: 'Không tìm thấy bài viết.' } };
            }

            const formData = await request.formData();

            // Update cơ bản
            const title = formData.get('title');
            if (title) {
                blog.title = title;
                blog.slug = slugify(title, { lower: true, strict: true });
            }

            if (formData.has('content')) blog.content = formData.get('content');
            if (formData.has('summary')) blog.summary = formData.get('summary');
            if (formData.has('status')) blog.status = formData.get('status');

            // Tags
            if (formData.has('tags')) {
                const rawTags = formData.get('tags');
                try {
                    let parsedTags = typeof rawTags === 'string' ? JSON.parse(rawTags) : [];
                    if (!Array.isArray(parsedTags)) {
                        return { status: 400, jsonBody: { message: 'Tags phải là mảng JSON' } };
                    }
                    blog.tags = parsedTags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
                } catch (err) {
                    return { status: 400, jsonBody: { message: 'Định dạng tags không hợp lệ' } };
                }
            }

            // Affiliate Links
            if (formData.has('affiliateLinks')) {
                const rawLinks = formData.get('affiliateLinks');
                try {
                    const parsed = JSON.parse(rawLinks);
                    blog.affiliateLinks = Array.isArray(parsed)
                        ? parsed.map(link => ({
                            label: link.label || '',
                            url: link.url || '',
                            image: link.image || ''
                        }))
                        : [];
                } catch (err) {
                    return { status: 400, jsonBody: { message: 'Định dạng affiliateLinks không hợp lệ' } };
                }
            }

            // Headings
            if (formData.has('headings')) {
                try {
                    blog.headings = JSON.parse(formData.get('headings'));
                } catch (err) {
                    return { status: 400, jsonBody: { message: 'Định dạng headings không hợp lệ' } };
                }
            }

            // Handle images
            let keptImages = [];
            if (formData.has('existingImages')) {
                try {
                    keptImages = JSON.parse(formData.get('existingImages'));
                } catch (err) {
                    return { status: 400, jsonBody: { message: 'Định dạng existingImages không hợp lệ' } };
                }
            }

            const keptPublicIds = new Set(keptImages.map(img => img.public_id));
            const deletedImages = blog.images.filter(img => !keptPublicIds.has(img.public_id));
            await Promise.all(deletedImages.map(img =>
                img.public_id ? cloudinary.uploader.destroy(img.public_id) : Promise.resolve()
            ));

            const imageFiles = formData.getAll('newImages');
            const captions = formData.getAll('newImageCaptions') || [];
            let uploadedImages = [];

            if (imageFiles.length > 0 && imageFiles[0].size > 0) {
                const uploadPromises = imageFiles.map(async (file, index) => {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    return new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            { folder: 'blogs' },
                            (err, result) => {
                                if (err) return reject(err);
                                resolve({
                                    url: result.secure_url,
                                    public_id: result.public_id,
                                    caption: captions[index] || ''
                                });
                            }
                        ).end(buffer);
                    });
                });
                uploadedImages = await Promise.all(uploadPromises);
            }

            blog.images = [...keptImages, ...uploadedImages];

            // Handle video
            const existingVideoRaw = formData.get('existingVideo');
            const newVideoFile = formData.get('newVideo');
            const newVideoCaption = formData.get('newVideoCaption');

            if (newVideoFile && newVideoFile.size > 0) {
                if (blog.video && blog.video.public_id) {
                    await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
                }
                const buffer = Buffer.from(await newVideoFile.arrayBuffer());
                const videoResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { resource_type: 'video', folder: 'blogs' },
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result);
                        }
                    ).end(buffer);
                });
                blog.video = {
                    url: videoResult.secure_url,
                    public_id: videoResult.public_id,
                    caption: newVideoCaption || ''
                };
            } else if (existingVideoRaw) {
                try {
                    blog.video = JSON.parse(existingVideoRaw);
                } catch {
                    return { status: 400, jsonBody: { message: 'Định dạng existingVideo không hợp lệ' } };
                }
            } else if (!existingVideoRaw && blog.video?.public_id) {
                await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
                blog.video = null;
            }

            await blog.save();

            await new Analytics({
                blogId: blog._id,
                action: 'update',
                ip: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                timestamp: new Date()
            }).save();

            return {
                status: 200,
                jsonBody: {
                    message: "Cập nhật bài viết thành công!",
                    blog: blog.toObject()
                }
            };

        } catch (error) {
            context.log('Error updating blog:', error);
            return {
                status: 500,
                jsonBody: {
                    message: 'Lỗi máy chủ nội bộ',
                    error: error.message
                }
            };
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
            context.log('Error getting all blogs:', error);
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
            context.log('Error updating blog status:', error);
            return { status: 500, jsonBody: { message: 'Internal server error', error: error.message } };
        }
    }
});

/**
 * @param {Buffer} buffer 
 * @returns {Promise<object>} 
 */

app.http('uploaderBlogImagesToCloud', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload-images',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: uploaderBlogImagesToCloud.');

        try {
            await connectDB();
            const formData = await request.formData();
            const files = formData.getAll('images');
            if (!files || files.length === 0) {
                return {
                    status: 400,
                    jsonBody: { message: 'Không có tệp hình ảnh nào được gửi.' }
                };
            }

            const uploadedImages = await Promise.all(
                files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const result = await uploadBufferToCloudinary(buffer);
                    return {
                        url: result.secure_url,
                        public_id: result.public_id,
                    };
                })
            );
            return {
                status: 200,
                jsonBody: {
                    message: 'Tải lên hình ảnh thành công',
                    images: uploadedImages,
                }
            };
        } catch (error) {
            context.log('Lỗi khi tải lên hình ảnh:', error);
            return {
                status: 500,
                jsonBody: {
                    message: 'Lỗi máy chủ nội bộ',
                    error: error.message,
                }
            };
        }
    }
});

app.http('uploaderBlogVideoToCloud', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload-video',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: uploaderBlogVideoToCloud.');

        try {
            await connectDB();
            const formData = await request.formData();
            const file = formData.get('video');

            if (!file || file.size === 0) {
                return {
                    status: 400,
                    jsonBody: { message: 'Không có tệp video nào được gửi.' }
                };
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'video', folder: 'blogs' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                ).end(buffer);
            });

            return {
                status: 200,
                jsonBody: {
                    message: 'Tải lên video thành công',
                    video: {
                        url: result.secure_url,
                        public_id: result.public_id
                    }
                }
            };

        } catch (error) {
            context.log('Lỗi khi tải lên video:', error);
            return {
                status: 500,
                jsonBody: {
                    message: 'Lỗi máy chủ nội bộ',
                    error: error.message
                }
            };
        }
    }
});