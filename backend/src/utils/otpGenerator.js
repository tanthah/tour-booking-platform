const crypto = require('crypto');
const { sendMail } = require('../config/mailer');

/**
 * Hàm sinh mã OTP số ngẫu nhiên gồm 6 chữ số bằng crypto module
 * @returns {string} Mã OTP 6 chữ số
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hàm tạo và gửi HTML email chứa mã OTP xác nhận tới người dùng
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} type - Mục đích OTP: 'REGISTER' (Đăng ký) hoặc 'FORGOT_PASSWORD' (Quên mật khẩu)
 */
const sendOtpEmail = async (email, otp, type = 'REGISTER') => {
  const subject =
    type === 'REGISTER'
      ? 'Xác thực tài khoản - Tour Booking Platform'
      : 'Khôi phục mật khẩu - Tour Booking Platform';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Tour Booking Platform</h1>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">
          ${type === 'REGISTER' ? 'Xác thực tài khoản của bạn' : 'Khôi phục mật khẩu'}
        </h2>
        <p style="color: #666; line-height: 1.6;">
          ${type === 'REGISTER'
      ? 'Cảm ơn bạn đã đăng ký. Vui lòng sử dụng mã OTP bên dưới để xác thực tài khoản:'
      : 'Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng sử dụng mã OTP bên dưới:'}
        </p>
        <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 14px;">
          Mã OTP có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
        </p>
      </div>
    </div>
  `;

  await sendMail(email, subject, html);
};

module.exports = { generateOTP, sendOtpEmail };
