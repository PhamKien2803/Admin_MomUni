const ExpertForm = require("../../model/expertForm.model");
const { sendExpertReplyMail } = require("../../utils/emailsExpertForm");


// API /api/expert-form/
exports.getExpertForm = async (req, res) => {
    try {
        const forms = await ExpertForm.find().sort({ createdAt: -1 }).populate('handledBy', 'name');
        return res.status(200).json({
            message: "Lấy danh sách câu hỏi thành công",
            data: forms
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
}

// API /api/expert-forms/:id
exports.deleteExpertForm = async (req, res) => {
    try {
        const form = await ExpertForm.findByIdAndDelete(req.params.id);
        if (!form) {
            return res.status(404).json({ message: 'Không tìm thấy câu hỏi để xóa' });
        }
        return res.status(200).json({
            message: "Xóa câu hỏi thành công",
            data: form
        });
    } catch (error) {
        console.error("Lỗi khi xóa expert form:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// API /api/expert-form/reply/:id
exports.replyExpertForm = async (req, res) => {
    try {
        const { message } = req.body;
        // const repliedBy = req.account.id;
        if (!message) return res.status(400).json({ message: 'Vui lòng nhập phản hồi' });
        const form = await ExpertForm.findById(req.params.rid);
        if (!form) return res.status(404).json({ message: 'Không tìm thấy câu hỏi' });
        form.replies.push({ message });//, repliedBy
        form.isHandled = true;
        // form.handledBy = repliedBy;
        form.handledAt = new Date();
        await form.save();
        await sendExpertReplyMail(form.email, form.name, form.question, message);
        return res.status(200).json({ message: 'Đã phản hồi và gửi email' });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
}