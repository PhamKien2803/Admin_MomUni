const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * @param {string} email 
 * @param {string} otp 
 */
const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: '"MomUni Affiliate" <no-reply@mevabe.com>',
        to: email,
        subject: "🔐 Mã xác thực đăng nhập dành cho Admin",
        html: `<!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mã OTP cho Admin</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background-color: #fff0f5; margin: 0; padding: 0; }
                .email-container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
                .header { background-color: #f8bbd0; color: #880e4f; padding: 24px; text-align: center; font-size: 22px; font-weight: bold; }
                .email-content { padding: 24px; color: #444; font-size: 16px; line-height: 1.6; }
                .otp-box { background-color: #f48fb1; color: #fff; font-size: 28px; font-weight: bold; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 2px; }
                .footer { background-color: #f8bbd0; color: #880e4f; padding: 16px; text-align: center; font-size: 14px; }
                .footer a { color: #880e4f; text-decoration: none; font-weight: bold; }
                .note { font-size: 14px; color: #999; margin-top: 12px; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">Mã OTP dành cho Quản trị viên</div>
                <div class="email-content">
                    <p>Xin chào Admin,</p>
                    <p>Hệ thống <strong>MomUni Affiliate</strong> vừa nhận yêu cầu xác thực. Vui lòng sử dụng mã OTP dưới đây để tiếp tục:</p>
                    <div class="otp-box">${otp}</div>
                    <p>Mã này có hiệu lực trong <strong>1 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                    <p>Nếu không phải bạn thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                    <p class="note">Bảo mật tài khoản là trách nhiệm của bạn. Không chia sẻ mã với người khác, kể cả nhân viên.</p>
                </div>
                <div class="footer">
                    &copy; 2025 MomUni Affiliate | <a href="https://mevabe.com">www.mevabe.com</a>
                </div>
            </div>
        </body>
        </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin OTP email sent to ${email}`);
};

module.exports = { sendOTPEmail };
