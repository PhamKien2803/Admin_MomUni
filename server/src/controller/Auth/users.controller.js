const bcrypt = require("bcryptjs");
const Users = require("../../model/users.model");
const { sendOTPEmail } = require("../../utils/emailsOTP");




//API: /api/auth/login
exports.loginAccount = async (req, res) => {
    try {
        const { username, password } = req.body;
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
};

exports.logOutAccount = async (req, res) => {
    try {
        return res.status(200).json({ message: "Đăng xuất thành công" });
    } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
        return res
            .status(500)
            .json({ message: "Lỗi trong quá trình đăng xuất", error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Please enter email !!" });
        const user = await Users.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email does not exist" });

        const otp = Math.floor(100000 + Math.random() * 900000);
        const hashedOtp = await bcrypt.hash(otp.toString(), 10);
        const otpExpiration = new Date(Date.now() + 5 + 60 * 1000);

        await Users.updateOne(
            { _id: user._id },
            { otp: hashedOtp, otpExpiration }
        );
        await sendOTPEmail(email, otp);
        return res.json({ message: "OTP has been sent to your email" });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error while sending OTP", error: error.message });
    }
};

//API: /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ message: "Please enter OTP" });
        const users = await Users.find({ otp: { $ne: null } });

        if (!users || users.length === 0) {
            return res.status(400).json({ message: "OTP is incorrect or expired" });
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
            return res.status(400).json({ message: "OTP is incorrect or expired" });
        }
        await Users.updateOne(
            { _id: matchedUser._id },
            { otp: null, otpExpiration: null }
        );
        return res.json({ message: "Valid OTP, please enter new password" });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error while verifying OTP", error: error.message });
    }
};

//API: /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required!" });
        }
        if (!newPassword || !confirmPassword) {
            return res
                .status(400)
                .json({ message: "Please enter complete information" });
        }
        if (newPassword !== confirmPassword) {
            return res
                .status(400)
                .json({ message: "Confirmed password does not match" });
        }
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Account not found" });
        }
        user.password = newPassword;
        user.otp = null;
        await user.save();
        return res.json({ message: "Password changed successfully!" });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error changing password", error: error.message });
    }
};


