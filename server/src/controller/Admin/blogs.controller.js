const slugify = require("slugify");
const Blogs = require("../../model/blogs.model");
const { cloudinary } = require('../../middleware/upload.middleware');
const Analytics = require("../../model/analytics.model");
const { default: mongoose } = require("mongoose");


module.exports.createBlog = async (req, res) => {
    try {
        const {
            title,
            content,
            summary,
            tags,
            status,
            affiliateLinks,
            headings,
            existingImages,
            newImageCaptions,
            existingVideo,
        } = req.body;

        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
                if (!Array.isArray(parsedTags)) {
                    return res.status(400).json({ message: 'Tags must be an array' });
                }
                parsedTags = parsedTags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
            } catch (error) {
                return res.status(400).json({ message: 'Invalid tags format' });
            }
        }

        const parsedAffiliateLinks = affiliateLinks ? JSON.parse(affiliateLinks) : [];
        const parsedHeadings = headings ? JSON.parse(headings) : [];
        const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
        const parsedExistingVideo = existingVideo ? JSON.parse(existingVideo) : null;

        const newImages = [];
        if (req.files && req.files.newImages) {
            const imageFiles = Array.isArray(req.files.newImages)
                ? req.files.newImages
                : [req.files.newImages];
            const captions = newImageCaptions
                ? Array.isArray(newImageCaptions)
                    ? newImageCaptions
                    : [newImageCaptions]
                : [];

            for (let i = 0; i < imageFiles.length; i++) {
                const result = await cloudinary.uploader.upload(imageFiles[i].path);
                newImages.push({
                    url: result.secure_url,
                    public_id: result.public_id,
                    caption: captions[i] || '',
                });
            }
        }

        let newVideo = null;
        if (req.files && req.files.newVideo) {
            const videoResult = await cloudinary.uploader.upload(req.files.newVideo.path, {
                resource_type: 'video',
            });
            newVideo = {
                url: videoResult.secure_url,
                public_id: videoResult.public_id,
                caption: req.body.newVideoCaption || '',
            };
        }

        const blog = new Blogs({
            title,
            content,
            summary,
            tags: parsedTags,
            status,
            affiliateLinks: parsedAffiliateLinks,
            headings: parsedHeadings,
            images: [...parsedExistingImages, ...newImages],
            video: newVideo || parsedExistingVideo,
            authorId: req.account.id || 'ADMIN_ID_PLACEHOLDER',
        });

        await blog.save();
        res.status(201).json({
            code: 201,
            message: 'Blog created successfully',
            data: blog,
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

module.exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blogs.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.images && blog.images.length > 0) {
            for (const img of blog.images) {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                }
            }
        }
        blog.deleted = true;
        await blog.save();
        await Blogs.findByIdAndUpdate(id, {
            status: true
        });
        const deleteAnalyticsBlog = await Analytics.deleteMany({ blogId: id });
        if (!deleteAnalyticsBlog) {
            return res.status(404).json({
                message: "Analytics not found"
            })
        }
        if (!deleteAnalyticsBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        await Blogs.findByIdAndDelete(id);
        res.status(200).json({
            code: 200,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

module.exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid blog ID' });
        }

        const blog = await Blogs.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const {
            title,
            content,
            summary,
            status,
            tags,
            affiliateLinks,
            headings,
            existingImages,
            existingVideo,
            newImageCaptions,
            newVideoCaption,
        } = req.body;

        // Update fields
        blog.title = title || blog.title;
        blog.slug = slugify(blog.title, { lower: true, strict: true });
        blog.content = content || blog.content;
        blog.summary = summary || blog.summary;
        blog.status = status || blog.status;

        // Handle tags
        if (tags !== undefined && tags !== '') {
            try {
                let parsedTags = [];
                if (typeof tags === 'string') {
                    parsedTags = JSON.parse(tags); // Expecting ["mẹ", "bé"]
                    if (!Array.isArray(parsedTags)) {
                        return res.status(400).json({ message: 'Tags must be an array' });
                    }
                    parsedTags = parsedTags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
                } else if (Array.isArray(tags)) {
                    parsedTags = tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
                }
                blog.tags = parsedTags;
            } catch (error) {
                return res.status(400).json({ message: 'Invalid tags format' });
            }
        } else {
            blog.tags = []; // Clear tags if empty or undefined
        }

        // Handle affiliateLinks
        if (affiliateLinks !== undefined) {
            try {
                let parsedLinks = [];
                if (typeof affiliateLinks === 'string') {
                    parsedLinks = JSON.parse(affiliateLinks);
                } else if (Array.isArray(affiliateLinks)) {
                    parsedLinks = affiliateLinks;
                }
                blog.affiliateLinks = parsedLinks.map(link => ({
                    label: link.label || '',
                    url: link.url || '',
                    image: link.image || '',
                }));
            } catch (error) {
                return res.status(400).json({ message: 'Định dạng JSON của affiliateLinks không hợp lệ.' });
            }
        }

        // Handle headings
        if (headings) {
            try {
                blog.headings = JSON.parse(headings);
            } catch (error) {
                return res.status(400).json({ message: 'Invalid headings format' });
            }
        }

        // Handle images
        let finalImages = [];
        const keptImages = existingImages ? JSON.parse(existingImages) : [];
        finalImages = [...keptImages];
        const keptImagePublicIds = new Set(keptImages.map(img => img.public_id));
        const imagesToDelete = blog.images.filter(img => !keptImagePublicIds.has(img.public_id));
        if (imagesToDelete.length > 0) {
            const deletePromises = imagesToDelete.map(img =>
                img.public_id ? cloudinary.uploader.destroy(img.public_id) : Promise.resolve()
            );
            await Promise.all(deletePromises);
        }

        if (req.files && req.files['newImages']) {
            const imageFiles = Array.isArray(req.files['newImages'])
                ? req.files['newImages']
                : [req.files['newImages']];
            const captions = Array.isArray(newImageCaptions)
                ? newImageCaptions
                : newImageCaptions
                    ? [newImageCaptions]
                    : [];
            const newUploadedImages = await Promise.all(
                imageFiles.map(async (file, index) => {
                    const result = await cloudinary.uploader.upload(file.path);
                    return {
                        url: result.secure_url,
                        public_id: result.public_id,
                        caption: captions[index] || '',
                    };
                })
            );
            finalImages.push(...newUploadedImages);
        }
        blog.images = finalImages;

        // Handle video
        if (req.files && req.files['newVideo']) {
            if (blog.video && blog.video.public_id) {
                await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
            }
            const videoFile = Array.isArray(req.files['newVideo'])
                ? req.files['newVideo'][0]
                : req.files['newVideo'];
            const videoResult = await cloudinary.uploader.upload(videoFile.path, {
                resource_type: 'video',
            });
            blog.video = {
                url: videoResult.secure_url,
                public_id: videoResult.public_id,
                caption: newVideoCaption || '',
            };
        } else if (existingVideo) {
            blog.video = JSON.parse(existingVideo);
        } else if (!existingVideo && blog.video && blog.video.public_id) {
            await cloudinary.uploader.destroy(blog.video.public_id, { resource_type: 'video' });
            blog.video = null;
        }

        await blog.save();

        // Log analytics
        const newAnalytics = new Analytics({
            blogId: blog._id,
            action: 'update',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
        });
        await newAnalytics.save();

        res.status(200).json({
            code: 200,
            message: 'Update Blog Successfully',
            blog,
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

module.exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;

        const baseQuery = {
            status: 'active',
            deleted: false
        };

        if (mongoose.Types.ObjectId.isValid(id)) {
            baseQuery._id = id;
        } else {
            baseQuery.slug = id;
        }

        const blog = await Blogs.findOneAndUpdate(
            baseQuery,
            { $inc: { viewCount: 1 } },
            { new: true }
        ).lean();

        if (!blog) {
            return res.status(404).json({ message: 'Blog không tồn tại hoặc đã bị xóa' });
        }

        res.status(200).json({
            message: 'Lấy thông tin blog thành công',
            blog,
        });

    } catch (error) {
        console.error('Lỗi khi lấy blog:', error);
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
