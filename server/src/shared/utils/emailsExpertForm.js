const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

async function sendUserConfirmationMail(to, name, question) {
  return transporter.sendMail({
    from: `MomUni <${process.env.MAIL_USER}>`,
    to,
    subject: '🎉 MomUni đã nhận được câu hỏi của bạn!',
    html: `
      <html>
        <body style="font-family: 'Inter', sans-serif; background: #f8f9fa; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <div style="background-color: #ffe9ec; padding: 20px; text-align: center;">
              <h2 style="color: #d6336c; margin: 0;">MomUni</h2>
              <p style="margin: 5px 0 0;">Chúng tôi đã nhận được câu hỏi của bạn!</p>
            </div>
            <div style="padding: 20px;">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Cảm ơn bạn đã gửi câu hỏi đến <strong>MomUni</strong>. Dưới đây là nội dung bạn đã gửi:</p>
              <div style="background-color: #f1f3f5; padding: 15px; border-left: 4px solid #ff8787; margin: 15px 0;">
                <strong>Câu hỏi:</strong><br>${question}
              </div>
              <p>🎯 Đội ngũ chuyên gia sẽ phản hồi bạn trong thời gian sớm nhất qua email này.</p>
              <p>Trân trọng,<br><strong>Đội ngũ MomUni</strong></p>
            </div>
            <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
              Đây là email tự động, vui lòng không phản hồi lại.
            </div>
          </div>
        </body>
      </html>
    `
  });
}

async function sendExpertReplyMail(to, name, question, replyMessage) {
  return transporter.sendMail({
    from: `MomUni - Chuyên Gia <${process.env.MAIL_USER}>`,
    to,
    subject: '💌 MomUni - Phản hồi từ chuyên gia dành cho bạn',
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', sans-serif;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background-color: #ffe9ec; padding: 30px 20px; text-align: center;">
              <h1 style="color: #d6336c; margin: 0;">MomUni</h1>
              <p style="margin: 5px 0 0; color: #444;">Phản hồi từ chuyên gia dành cho bạn</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 20px;">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Chúng tôi rất cảm ơn bạn đã gửi câu hỏi đến <strong>MomUni</strong>. Dưới đây là nội dung bạn đã gửi:</p>
              <div style="background-color: #f1f3f5; padding: 15px; border-left: 4px solid #ff8787; margin: 15px 0;">
                <strong>Câu hỏi:</strong><br>${question}
              </div>
  
              <p>💡 <strong>Phản hồi từ chuyên gia:</strong></p>
              <div style="background-color: #fff3bf; padding: 15px; border-left: 4px solid #fcc419; margin: 15px 0; font-style: italic;">
                ${replyMessage}
              </div>
  
              <p>Hy vọng câu trả lời sẽ giúp ích cho bạn trên hành trình nuôi dạy con khỏe mạnh và hạnh phúc 💖</p>
              <p>Thân mến,<br><strong>Đội ngũ chuyên gia MomUni</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888;">
              Bạn nhận được email này vì đã gửi câu hỏi tại MomUni.<br>
              Vui lòng không phản hồi lại email này.
            </td>
          </tr>
        </table>
      </body>
      </html>
      `
  });
}



module.exports = { sendExpertReplyMail, sendUserConfirmationMail };