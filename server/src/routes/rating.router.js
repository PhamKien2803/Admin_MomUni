const express = require('express');
const router = express.Router();
const controller = require('../controller/Customer/rating.controller');

router.get('/', controller.getRatings);
router.post('/user-rating', controller.createRating)

module.exports = router;