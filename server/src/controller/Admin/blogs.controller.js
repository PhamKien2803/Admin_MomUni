const slugify = require("slugify");
const Blogs = require("../../model/blogs.model");
const { cloudinary } = require('../../middleware/upload.middleware');
const Analytics = require("../../model/analytics.model")

// module.exports.createBlog = async (req, res) => {
//     try {
//         const { title, content } = req.body;
//         if (!title || !content) {
//             return res.status(400).json({ message: 'Missing required fields: title, content' });
//         }
//         req.body.slug = slugify(title, { lower: true, strict: true });

//         if (req.body.tags) {
//             req.body.tags = Array.isArray(req.body.tags)
//                 ? req.body.tags
//                 : req.body.tags.split(',').map(tag => tag.trim());
//         }

//         if (req.body.affiliateLinks) {
//             req.body.affiliateLinks = typeof req.body.affiliateLinks === 'string'
//                 ? JSON.parse(req.body.affiliateLinks)
//                 : req.body.affiliateLinks;
//         }

//         if (req.files) {
//             if (req.files['images']) {
//                 const captions = Array.isArray(req.body.captions)
//                     ? req.body.captions
//                     : req.body.captions
//                         ? [req.body.captions]
//                         : [];

//                 req.body.images = req.files['images'].map((file, index) => ({
//                     url: file.path,
//                     caption: captions[index] || '',
//                     public_id: file.filename,
//                 }));
//             }

//             if (req.files['video'] && req.files['video'][0]) {
//                 const videoFile = req.files['video'][0];
//                 req.body.video = {
//                     url: videoFile.path,
//                     caption: '',
//                     public_id: videoFile.filename,
//                 };
//             }
//         }
//         const newBlog = new Blogs(req.body);
//         await newBlog.save();
//         const newAnalytics = new Analytics({
//             blogId: newBlog._id,
//             action: "create",
//             affiliateUrl: null,
//             revenue: 0,
//             ip: req.ip,
//             userAgent: req.headers['user-agent'],
//             timestamp: new Date()
//         })
//         await newAnalytics.save();
//         res.json({
//             code: 201,
//             message: "Create Blog Successfully"
//         })
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error', error })
//     }
// }


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



module.exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blogs.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        if (blog.images?.length > 0) {
            for (const img of blog.images) {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                }
            }
        }
        if (blog.video?.public_id) {
            await cloudinary.uploader.destroy(blog.video.public_id);
        }
        blog.deleted = true;
        blog.status = 'inactive';
        await blog.save();
        await Analytics.deleteMany({ blogId: id });
        await Blogs.findByIdAndDelete(id);
        res.status(200).json({
            code: 200,
            message: 'Blog deleted successfully (soft delete)'
        });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};


module.exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const body = await request.json();
        const {
            title,
            content,
            summary,
            tags,
            affiliateLinks,
            captions
        } = body;

        const blog = await Blogs.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (title) {
            blog.title = title;
            blog.slug = slugify(title, { lower: true, strict: true });
        }

        if (content !== undefined) blog.content = content;
        if (summary !== undefined) blog.summary = summary;
        if (req.files) {

            if (req.files?.['images']) {
                if (blog.images && blog.images.length > 0) {
                    for (const img of blog.images) {
                        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
                    }
                }

                blog.images = req.files['images'].map((file, index) => ({
                    url: file.path,
                    caption: Array.isArray(captions) ? captions[index] : '',
                    public_id: file.filename
                }));
            }

            if (req.files?.['video'] && req.files['video'][0]) {
                if (blog.video && blog.video.public_id) {
                    await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
                }

                const videoFile = req.files['video'][0];
                blog.video = {
                    url: videoFile.path,
                    caption: '',
                    public_id: videoFile.filename
                };
            }
        }

        if (tags !== undefined) {
            blog.tags = Array.isArray(tags)
                ? tags
                : typeof tags === 'string'
                    ? tags.split(',').map(tag => tag.trim())
                    : [];
        }

        if (affiliateLinks !== undefined) {
            blog.affiliateLinks = typeof affiliateLinks === 'string'
                ? JSON.parse(affiliateLinks)
                : affiliateLinks;
        }

        await blog.save();

        res.status(200).json({
            code: 200,
            message: "Update Blog Successfully"
        });

    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

module.exports.getBlog = async (req, res) => {
    try {
        const blogs = await Blogs.find({})
        res.json({
            code: 200,
            blogs,
            message: "Get All Blog Successfully"
        })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
}

module.exports.updateBlogStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Status không hợp lệ. Chỉ có thể là "active" hoặc "inactive".' });
        }

        const blog = await Blogs.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog không tồn tại' });
        }

        blog.status = status;
        await blog.save();

        res.status(200).json({
            code: 200,
            message: `Cập nhật status blog thành công`,
            blog,
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật status blog:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }
};