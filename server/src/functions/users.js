const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const Users = require("../shared/model/users.model");
const connectDB = require('../shared/mongoose');
const { sendOTPEmail } = require('../shared/utils/emailsOTP');


app.http('RegisterAccount', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/register',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: RegisterAccount.');
        try {
            await connectDB();
            const body = await request.json();
            const { email, username, password } =
                body;

            if (!email || !username || !password) {
                return {
                    status: 400,
                    jsonBody: { message: "Please enter complete information!" }
                }
            }

            const existingUser = await Users.findOne({
                $or: [{ email }, { username }],
            });

            if (existingUser) {
                return {
                    status: 400,
                    jsonBody: { message: "Email or username already exists!" }
                };
            }
            try {
                const newAccount = new Users({
                    email,
                    username,
                    password,
                });
                await newAccount.save();

                return {
                    status: 201,
                    jsonBody: {
                        message: "Account created successfully",
                        user: {
                            id: newAccount._id,
                            username: newAccount.username,
                            role: newAccount.role
                        }
                    }
                };
            } catch (error) {
                if (error.name === "ValidationError") {
                    const validationErrors = Object.values(error.errors).map(
                        (err) => err.message
                    );
                    return {
                        status: 400,
                        jsonBody: { message: "Validation error", errors: validationErrors }
                    }
                }
                return {
                    status: 500,
                    jsonBody: { message: "Error while logging in", error: error.message }
                };
            }
        } catch (error) {
            return {
                status: 500,
                jsonBody: { message: "Error while logging in", error: error.message }
            };
        }
    }
})


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
                return {
                    status: 400,
                    jsonBody: { message: "Please enter complete information !" }
                };
            }
            const user = await Users.findOne({ username });
            if (!user) {
                return {
                    status: 404,
                    jsonBody: { message: "Account not created !!" }
                };
            }
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return {
                    status: 401,
                    jsonBody: { message: "Username or password is incorrect!!" }
                };
            }
            return {
                status: 200,
                jsonBody: {
                    message: "Login successfully",
                    user: {
                        id: user._id,
                        username: user.username,
                        role: user.role
                    }
                }
            };
        } catch (error) {
            console.error("Error during login:", error);
            return {
                status: 500,
                jsonBody: { message: "Error while logging in", error: error.message }
            };
        }
    }
});

app.http('LogoutAccount', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/logout',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: LogoutAccount.');
        try {
            await connectDB();
            return {
                status: 200,
                jsonBody: { message: "Đăng xuất thành công" }
            };
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            return {
                status: 500,
                jsonBody: { message: "Lỗi trong quá trình đăng xuất", error: error.message }
            };
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