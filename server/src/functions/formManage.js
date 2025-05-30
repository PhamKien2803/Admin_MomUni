const { app } = require('@azure/functions');
const connectDB = require('../shared/mongoose');
const ExpertForm = require("../shared/model/expertForm.model");
const { sendExpertReplyMail } = require("../shared/utils/emailsExpertForm");

app.http('getExpertForm', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'expert-form',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: getExpertForm.');
        try {
            await connectDB();
            const forms = await ExpertForm.find()
                .sort({ createdAt: -1 })
                .populate('handledBy', 'name');
            return {
                status: 200,
                jsonBody: {
                    message: "Lấy danh sách câu hỏi thành công",
                    data: forms
                }
            };
        } catch (error) {
            context.log.error("Error in getExpertForm:", error.message);
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

// Xoá form chuyên gia theo ID
app.http('deleteExpertForm', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'expert-forms/{id}',
    handler: async (request, context) => {
        context.log('HTTP trigger: deleteExpertForm processed a request.');
        try {
            await connectDB();
            const formId = request.params.id;
            const form = await ExpertForm.findByIdAndDelete(formId);
            if (!form) {
                return {
                    status: 404,
                    jsonBody: { message: 'Không tìm thấy câu hỏi để xóa' }
                };
            }
            return {
                status: 200,
                jsonBody: {
                    message: "Xóa câu hỏi thành công",
                    data: form
                }
            };
        } catch (error) {
            context.log.error("Error in deleteExpertForm:", error.message);
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

// Phản hồi form chuyên gia và gửi email
app.http('replyExpertForm', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'expert-form/reply/{id}',
    handler: async (request, context) => {
        context.log('HTTP trigger: replyExpertForm processed a request.');
        try {
            await connectDB();
            const formId = request.params.id;
            const { message } = await request.json();

            if (!message) {
                return {
                    status: 400,
                    jsonBody: { message: 'Vui lòng nhập phản hồi.' }
                };
            }

            const form = await ExpertForm.findById(formId);
            if (!form) {
                return {
                    status: 404,
                    jsonBody: { message: 'Không tìm thấy câu hỏi' }
                };
            }

            form.replies.push({ message });
            form.isHandled = true;
            form.handledAt = new Date();
            await form.save();

            await sendExpertReplyMail(form.email, form.name, form.question, message);

            return {
                status: 200,
                jsonBody: { message: 'Đã phản hồi và gửi email thành công' }
            };

        } catch (error) {
            context.log.error("Error in replyExpertForm:", error.message);
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