const express = require('express');
const router = express.Router();
const controller = require('../controller/Admin/blogs.controller');
const { upload } = require('../middleware/upload.middleware');

// /admin/blog
router.post('/create', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]), controller.createBlog)
router.put('/update/:id', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]), controller.updateBlog)
router.delete('/delete/:id', controller.deleteBlog)
router.get('/', controller.getBlog)
router.put('/update-status/:id', controller.updateBlogStatus)

module.exports = router;