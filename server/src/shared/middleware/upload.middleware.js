const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let resource_type = 'image';
        const imageFormats = ['image/jpeg', 'image/png', 'image/webp'];
        const videoFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

        if (videoFormats.includes(file.mimetype)) {
            resource_type = 'video';
        }

        return {
            folder: resource_type === 'image' ? 'blogs/images' : 'blogs/videos',
            resource_type,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi'],
            transformation: resource_type === 'image' ? [{ width: 1000, crop: 'limit' }] : undefined
        };
    }
});

const upload = multer({ storage });


/**
 * @param {Buffer} buffer 
 * @param {'image' | 'video'} resource_type
 * @returns {Promise<object>} 
 */
const uploadBufferToCloudinary = async (buffer, resource_type = 'image') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: resource_type === 'image' ? 'blogs/images' : 'blogs/videos',
                resource_type,
                transformation: resource_type === 'image' ? [{ width: 1000, crop: 'limit' }] : undefined
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

module.exports = { upload, cloudinary, uploadBufferToCloudinary };
