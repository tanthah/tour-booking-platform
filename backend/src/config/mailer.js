const nodemailer = require('nodemailer');
const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM } = require('./env');

// Khởi tạo Transporter cho Nodemailer để gửi mail qua Gmail SMTP với App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: MAIL_HOST,
  port: Number(MAIL_PORT),
  secure: false,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS.replace(/\s/g, ''), // Loại bỏ khoảng trắng trong App Password nếu có
  },
  tls: {
    rejectUnauthorized: false, // Bỏ qua lỗi TLS certificate trong môi trường Development
  },
});

/**
 * Hàm gửi email chung cho hệ thống
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề (Subject) của email
 * @param {string} html - Nội dung HTML của email
 */
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      html,
      // Headers bổ sung để giảm khả năng bị lọc vào Spam
      replyTo: MAIL_FROM,
      priority: 'high',
      headers: {
        'X-Mailer': 'Tour Booking Platform Mailer',
        'X-Priority': '1',
      },
    });
    // Log cả địa chỉ người nhận để dễ debug
    console.log(`[Mailer] Email sent to: ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Mailer] Send email error to ${to}: ${error.message}`);
    throw error;
  }
};


module.exports = { transporter, sendMail };
