const express = require('express');
const router = express.Router();
const controller = require('../controller/Customer/comment.controller');

router.get('/', controller.getComments);
router.post('/user-comment', controller.createComment)

module.exports = router;