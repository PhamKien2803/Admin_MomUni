const express = require('express');
const router = express.Router();
const notificationController = require("../controller/Admin/notification.controller")

router.get("/", notificationController.getNotifications);
router.patch("/read/:id", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;