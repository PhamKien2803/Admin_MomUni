const { app } = require('@azure/functions');
const connectDB = require('../shared/mongoose');
const Notification = require("../shared/model/notification.model");

app.http('getNotifications', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            await connectDB();
            const notifications = await Notification.find().sort({ createdAt: -1 });
            return {
                status: 200,
                jsonBody: notifications
            };
        } catch (err) {
            context.log.error('Error in getNotifications:', err.message);
            return {
                status: 500,
                jsonBody: { message: 'Lỗi server khi lấy thông báo' }
            };
        }
    }
});

app.http('markAsRead', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'notification/read/{id}',
    handler: async (request, context) => {
        try {
            await connectDB();
            const notificationId = request.params.id;
            await Notification.findByIdAndUpdate(notificationId, { isRead: true });
            return {
                status: 200,
                jsonBody: { message: 'Đã đánh dấu là đã đọc.' }
            };
        } catch (err) {
            context.log.error('Error in markAsRead:', err.message);
            return {
                status: 500,
                jsonBody: { message: 'Lỗi server khi cập nhật.' }
            };
        }
    }
});

app.http('deleteNotification', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'notification/{id}',
    handler: async (request, context) => {
        try {
            await connectDB();
            const notificationId = request.params.id;
            await Notification.findByIdAndDelete(notificationId);
            return {
                status: 200,
                jsonBody: { message: 'Đã xóa thông báo.' }
            };
        } catch (err) {
            context.log.error('Error in deleteNotification:', err.message);
            return {
                status: 500,
                jsonBody: { message: 'Lỗi server khi xóa thông báo.' }
            };
        }
    }
});