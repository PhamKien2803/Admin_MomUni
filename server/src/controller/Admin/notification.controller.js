const Notification = require("../../model/notification.model")

// GET /api/notification
exports.getNotifications = async (req, res) => {
    try {
        // const userId = req.account.id;
        const notifications = await Notification.find() //{ userId }
            .sort({ createdAt: -1 });

        return res.status(200).json(notifications);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
    }
};

// PATCH /api/notification/read/:id
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        return res.status(200).json({ message: 'Đã đánh dấu là đã đọc' });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi cập nhật' });
    }
};

// DELETE /api/notification/:id
exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Đã xóa thông báo' });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi xóa thông báo' });
    }
};


