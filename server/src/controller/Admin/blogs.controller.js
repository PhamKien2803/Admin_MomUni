const slugify = require("slugify");
const Blogs = require("../../model/blogs.model");
const { cloudinary } = require('../../middleware/upload.middleware');
const Analytics = require("../../model/analytics.model")

module.exports.createBlog = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Missing required fields: title, content' });
        }
        req.body.slug = slugify(title, { lower: true, strict: true });

        if (req.body.tags) {
            req.body.tags = Array.isArray(req.body.tags)
                ? req.body.tags
                : req.body.tags.split(',').map(tag => tag.trim());
        }

        if (req.body.affiliateLinks) {
            req.body.affiliateLinks = typeof req.body.affiliateLinks === 'string'
                ? JSON.parse(req.body.affiliateLinks)
                : req.body.affiliateLinks;
        }

        if (req.files) {
            if (req.files['images']) {
                const captions = Array.isArray(req.body.captions)
                    ? req.body.captions
                    : req.body.captions
                        ? [req.body.captions]
                        : [];

                req.body.images = req.files['images'].map((file, index) => ({
                    url: file.path,
                    caption: captions[index] || '',
                    public_id: file.filename,
                }));
            }

            if (req.files['video'] && req.files['video'][0]) {
                const videoFile = req.files['video'][0];
                req.body.video = {
                    url: videoFile.path,
                    caption: '',
                    public_id: videoFile.filename,
                };
            }
        }
        const newBlog = new Blogs(req.body);
        await newBlog.save();
        const newAnalytics = new Analytics({
            blogId: newBlog._id,
            action: "create",
            affiliateUrl: null,
            revenue: 0,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
        })
        await newAnalytics.save();
        res.json({
            code: 201,
            message: "Create Blog Successfully"
        })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error })
    }
}


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
        const blog = await Blogs.findById(id);

        if (!blog) {
            return res.status(404).json({ message: "Không tìm thấy bài viết." });
        }
        const {
            title, content, summary, status, tags, affiliateLinks, headings,
            existingImages,
            existingVideo,
            newImageCaptions,
            newVideoCaption
        } = req.body;
        blog.title = title || blog.title;
        blog.slug = slugify(blog.title, { lower: true, strict: true });
        blog.content = content || blog.content;
        blog.summary = summary || blog.summary;
        blog.status = status || blog.status;

        if (tags && typeof tags === 'string') {
            blog.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        if (headings) {
            blog.headings = JSON.parse(headings);
        }
        if (affiliateLinks && typeof affiliateLinks === 'string') {
            try {
                const parsedLinks = JSON.parse(affiliateLinks);
                blog.affiliateLinks = parsedLinks.map(link => ({
                    label: link.label,
                    url: link.url,
                    image: link.image
                }));
            } catch (e) {
                return res.status(400).json({ message: 'Định dạng JSON của affiliateLinks không hợp lệ.' });
            }
        } else if (Array.isArray(affiliateLinks)) {
            blog.affiliateLinks = affiliateLinks.map(link => ({
                label: link.label,
                url: link.url,
                image: link.image
            }));
        }
        let finalImages = [];
        const keptImages = existingImages ? JSON.parse(existingImages) : [];
        finalImages = [...keptImages];
        const keptImagePublicIds = new Set(keptImages.map(img => img.public_id));
        const imagesToDelete = blog.images.filter(img => !keptImagePublicIds.has(img.public_id));
        if (imagesToDelete.length > 0) {
            const deletePromises = imagesToDelete.map(img => cloudinary.uploader.destroy(img.public_id));
            await Promise.all(deletePromises);
        }
        if (req.files && req.files['newImages']) {
            const captions = Array.isArray(newImageCaptions) ? newImageCaptions : (newImageCaptions ? [newImageCaptions] : []);
            const newUploadedImages = req.files['newImages'].map((file, index) => ({
                url: file.path,
                public_id: file.filename,
                caption: captions[index] || ''
            }));
            finalImages.push(...newUploadedImages);
        }
        blog.images = finalImages;
        if (req.files && req.files['newVideo']) {
            if (blog.video && blog.video.public_id) {
                await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
            }
            const videoFile = req.files['newVideo'][0];
            blog.video = {
                url: videoFile.path,
                public_id: videoFile.filename,
                caption: newVideoCaption || ''
            };
        }
        else {
            const keptVideo = existingVideo ? JSON.parse(existingVideo) : null;
            if (!keptVideo && blog.video && blog.video.public_id) {
                await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
                blog.video = null;
            }
        }

        if (tags !== undefined && tags !== '') {
            blog.tags = typeof tags === 'string' && tags
                ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                : Array.isArray(tags) ? tags : [];
        }
        if (affiliateLinks !== undefined) {
            blog.affiliateLinks = typeof affiliateLinks === 'string'
                ? JSON.parse(affiliateLinks)
                : affiliateLinks;
        }

        await blog.save();
        const newAnalytics = new Analytics({
            blogId: blog._id,
            action: "update",
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
        });
        await newAnalytics.save();
        res.status(200).json({

            code: 200,
            message: "Update Blog Successfully",
            blog
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật bài viết:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
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

module.exports.uploaderBlogImagesToCloud = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'Không có tệp hình ảnh nào được gửi.' });
        }

        const uploadedImages = await Promise.all(
            files.map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'blogs/images',
                    resource_type: 'image',
                    transformation: [{ width: 1000, crop: 'limit' }],
                });

                return {
                    url: result.secure_url,
                    public_id: result.public_id,
                };
            })
        );

        res.status(200).json({
            message: 'Tải lên hình ảnh thành công',
            images: uploadedImages,
        });
    } catch (error) {
        console.error('Lỗi khi tải lên hình ảnh:', error);
        res.status(500).json({
            message: 'Lỗi máy chủ nội bộ',
            error: error.message,
        });
    }
};