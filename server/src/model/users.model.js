const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const UsersSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["admin"],
        required: true,
        default: "admin",
    },
    username: { type: String, trim: true },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, "Invalid email format"],
    },
    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 characters"],
    },
    otp: { type: String, default: null },
    otpExpiration: { type: Date, default: null },
    // accesstoken: String,
    re_token: String,
}, {
    timestamps: true, versionKey: false,
})
UsersSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const Users = mongoose.model('Users', UsersSchema, 'users');

module.exports = Users;