const mongoose = require("mongoose");

const ExpertFormSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    question: { type: String, required: true },
    topic: { type: String, required: true },

    isHandled: { type: Boolean, default: false },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    handledAt: { type: Date },

    replies: [{
        message: { type: String, required: true },
        repliedAt: { type: Date, default: Date.now },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }
    }],

    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const ExpertForm = mongoose.model('ExpertForm', ExpertFormSchema, 'expertForms');

module.exports = ExpertForm;
