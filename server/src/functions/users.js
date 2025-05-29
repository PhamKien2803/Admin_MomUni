const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const Users = require("../shared/model/users.model");
const connectDB = require('../shared/mongoose');


app.http('LoginAccount', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/login',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: LoginAccount.');
        try {
            await connectDB();
            const body = await request.json();
            const { username, password } = body;
            if (!username || !password) {
                return res
                    .status(400)
                    .json({ message: "Please enter complete information !" });
            }
            const user = await Users.findOne({ username });
            if (!user) {
                return res.status(404).json({
                    message: "Account not created !!",
                });
            }
            console.log("User found:", user);
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return res
                    .status(401)
                    .json({ message: "Username or password is incorrect!!" });
            }
            return res.status(200).json({
                message: "Login successfully",
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            console.error("Error during login:", error);
            return res
                .status(500)
                .json({ message: "Error while logging in", error: error.message });
        }
    }
});


app.http('LogoutAccount', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/logout',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: LoginAccount.');
        try {
            await connectDB();
            return res.status(200).json({ message: "Đăng xuất thành công" });
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            return res
                .status(500)
                .json({ message: "Lỗi trong quá trình đăng xuất", error: error.message });
        }
    }
});

app.http('ForgotPassword', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/forgot-password',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: ForgotPassword.');

        try {
            await connectDB();
            const body = await request.json();
            const { email } = body;
            if (!email) {
                return { status: 400, jsonBody: { message: "Please enter email !!" } };
            }
            const user = await Users.findOne({ email });
            if (!user) {
                return { status: 404, jsonBody: { message: "Email does not exist" } };
            }
            const otp = Math.floor(100000 + Math.random() * 900000);
            const hashedOtp = await bcrypt.hash(otp.toString(), 10);
            const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
            await Users.updateOne(
                { _id: user._id },
                { otp: hashedOtp, otpExpiration }
            );
            await sendOTPEmail(email, otp);
            return { status: 200, jsonBody: { message: "OTP has been sent to your email" } };
        } catch (error) {
            context.error(`Error while sending OTP: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: "Error while sending OTP", error: error.message }
            };
        }
    }
});

app.http('VerifyOTP', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/verify-otp',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: VerifyOTP.');

        try {
            await connectDB();
            const body = await request.json();
            const { otp } = body;
            if (!otp) {
                return { status: 400, jsonBody: { message: "Please enter OTP" } };
            }
            const users = await Users.find({ otp: { $ne: null } });
            if (!users || users.length === 0) {
                return { status: 400, jsonBody: { message: "OTP is incorrect or expired" } };
            }
            let matchedUser = null;
            for (const user of users) {
                if (user.otpExpiration && new Date() < user.otpExpiration) {
                    const isMatch = await bcrypt.compare(otp.toString(), user.otp);
                    if (isMatch) {
                        matchedUser = user;
                        break;
                    }
                }
            }
            if (!matchedUser) {
                return { status: 400, jsonBody: { message: "OTP is incorrect or expired" } };
            }

            await Users.updateOne(
                { _id: matchedUser._id },
                { otp: null, otpExpiration: null }
            );
            return { status: 200, jsonBody: { message: "Valid OTP, please enter new password" } };
        } catch (error) {
            context.error(`Error while verifying OTP: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: "Error while verifying OTP", error: error.message }
            };
        }
    }
});

app.http('ResetPassword', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'auth/reset-password',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: ResetPassword.');

        try {
            await connectDB();
            const body = await request.json();
            const { email, newPassword, confirmPassword } = body;
            if (!email) {
                return { status: 400, jsonBody: { message: "Email is required!" } };
            }
            if (!newPassword || !confirmPassword) {
                return {
                    status: 400,
                    jsonBody: { message: "Please enter complete information" }
                };
            }
            if (newPassword !== confirmPassword) {
                return {
                    status: 400,
                    jsonBody: { message: "Confirmed password does not match" }
                };
            }
            const user = await Users.findOne({ email });
            if (!user) {
                return { status: 404, jsonBody: { message: "Account not found" } };
            }
            user.password = newPassword;
            await user.save();
            return { status: 200, jsonBody: { message: "Password changed successfully!" } };
        } catch (error) {
            context.error(`Error changing password: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: "Error changing password", error: error.message }
            };
        }
    }
});