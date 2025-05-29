const { app } = require('@azure/functions');
const connectDB = require('../shared/mongoose');
const ExpertForm = require("../shared/model/expertForm.model");
const Notification = require("../shared/model/notification.model");
const Users = require("../shared/model/users.model");
const { sendUserConfirmationMail } = require('../shared/utils/emailsExpertForm');

app.http('createExpertForm', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'expert-form/create',
    handler: async (request, context) => {
        try {
            await connectDB();
            const body = await request.json();
            const { name, email, phone, question, topic } = body;

            if (!name || !email || !phone || !question || !topic) {
                return { status: 400, jsonBody: { message: 'Thiếu thông tin bắt buộc' } };
            }
            const newForm = await ExpertForm.create({ name, email, phone, question, topic });
            await sendUserConfirmationMail(email, name, question);
            const experts = await Users.find({ role: 'admin' });
            if (experts.length > 0) {
                const notifications = experts.map(expert => ({
                    userId: expert._id,
                    expertFormId: newForm._id,
                    message: `Bạn có câu hỏi mới từ ${name} về chủ đề "${topic}".`,
                }));
                await Notification.insertMany(notifications);
            }

            return {
                status: 201,
                jsonBody: { message: 'Gửi câu hỏi thành công', data: newForm }
            };
        } catch (error) {
            context.log.error("Lỗi gửi form:", error.message);
            return {
                status: 500,
                jsonBody: {
                    message: "Internal server error",
                    error: error.message
                }
            };
        }
    }
});