const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controller/Admin/analytics.controller');

router.get("/", AnalyticsController.getAnalytics);
router.get("/total-blogs", AnalyticsController.getTotalBlogs);
router.get("/total-views", AnalyticsController.getTotalViews);
router.get("/total-visitors", AnalyticsController.getTotalVisitors);
// router.post("/track-action", AnalyticsController.trackActionIp);


module.exports = router;