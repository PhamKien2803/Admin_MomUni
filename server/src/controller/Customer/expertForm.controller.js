const ExpertForm = require("../../model/expertForm.model")
const Notification = require("../../model/notification.model")
const Users = require("../../model/users.model")
const { sendUserConfirmationMail } = require('../../utils/emailsExpertForm');


// API: /api/expert-form/create
exports.sendExpertForm = async (req, res) => {
    try {
        const { name, email, phone, question, topic } = req.body;

        if (!name || !email || !phone || !question || !topic) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        const newForm = await ExpertForm.create({ name, email, phone, question, topic });
        await sendUserConfirmationMail(email, name, question);
        const experts = await Users.find({ role: 'admin' });
        const notifications = experts.map(expert => ({
            userId: expert._id,
            expertFormId: newForm._id,
            message: `Bạn có câu hỏi mới từ ${name} về chủ đề "${topic}".`,
        }));
        await Notification.insertMany(notifications);
        return res.status(201).json({ message: 'Gửi câu hỏi thành công', data: newForm });
    } catch (error) {
        console.error("Lỗi gửi form:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}