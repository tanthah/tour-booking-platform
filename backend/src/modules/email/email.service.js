const { sendMail } = require('../../config/mailer');

// ============================================================
//  EMAIL TEMPLATES - Các template HTML cho từng loại email
// ============================================================

/**
 * Template email chào mừng thành viên mới + Mã OTP xác thực tài khoản
 * @param {string} fullName - Tên người dùng
 * @param {string} otp - Mã OTP 6 chữ số
 * @returns {string} HTML string
 */
const buildWelcomeOtpTemplate = (fullName, otp) => {
  return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:36px 30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:-0.5px;">✈ Tour Booking Platform</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Nền tảng đặt tour du lịch hàng đầu Việt Nam</p>
      </div>
      <div style="background:#fff;padding:40px 36px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <h2 style="color:#1e293b;font-size:22px;margin:0 0 12px;">Chào mừng, ${fullName}! 🎉</h2>
        <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
          Cảm ơn bạn đã đăng ký tài khoản tại <strong>Tour Booking Platform</strong>.
          Chúng tôi rất vui được đồng hành cùng bạn trên những hành trình tuyệt vời khám phá Việt Nam!
        </p>
        <p style="color:#475569;line-height:1.7;margin:0 0 20px;">
          Để kích hoạt tài khoản, vui lòng nhập mã OTP bên dưới:
        </p>
        <div style="background:#f8fafc;border:2px dashed #667eea;border-radius:14px;padding:24px;text-align:center;margin:24px 0;">
          <p style="color:#94a3b8;font-size:13px;margin:0 0 10px;letter-spacing:1px;">MÃ XÁC THỰC TÀI KHOẢN</p>
          <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#667eea;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.8;margin:0;">
          ⏱ Mã có hiệu lực trong <strong>5 phút</strong>.<br>
          🔒 Vui lòng không chia sẻ mã này với bất kỳ ai.
        </p>
      </div>
      <p style="text-align:center;color:#cbd5e1;font-size:12px;margin-top:20px;">
        © 2026 Tour Booking Platform · Mọi quyền được bảo lưu.
      </p>
    </div>
  `;
};

/**
 * Template email khôi phục mật khẩu + Mã OTP
 * @param {string} otp - Mã OTP 6 chữ số
 * @returns {string} HTML string
 */
const buildForgotPasswordTemplate = (otp) => {
  return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:36px 30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:-0.5px;">✈ Tour Booking Platform</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Nền tảng đặt tour du lịch hàng đầu Việt Nam</p>
      </div>
      <div style="background:#fff;padding:40px 36px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <h2 style="color:#1e293b;font-size:22px;margin:0 0 12px;">🔑 Yêu cầu khôi phục mật khẩu</h2>
        <p style="color:#475569;line-height:1.7;margin:0 0 20px;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
          Vui lòng nhập mã OTP bên dưới để tiến hành đặt lại mật khẩu:
        </p>
        <div style="background:#f8fafc;border:2px dashed #667eea;border-radius:14px;padding:24px;text-align:center;margin:24px 0;">
          <p style="color:#94a3b8;font-size:13px;margin:0 0 10px;letter-spacing:1px;">MÃ KHÔI PHỤC MẬT KHẨU</p>
          <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#667eea;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.8;margin:0;">
          ⏱ Mã có hiệu lực trong <strong>5 phút</strong>.<br>
          🔒 Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
        </p>
      </div>
      <p style="text-align:center;color:#cbd5e1;font-size:12px;margin-top:20px;">
        © 2026 Tour Booking Platform · Mọi quyền được bảo lưu.
      </p>
    </div>
  `;
};

// ============================================================
//  EMAIL SERVICE FUNCTIONS - Các hàm gửi email theo mục đích
// ============================================================

/**
 * Gửi email chào mừng thành viên mới kèm mã OTP xác thực tài khoản
 * @param {string} to - Email người nhận
 * @param {string} fullName - Tên đầy đủ để cá nhân hóa lời chào
 * @param {string} otp - Mã OTP 6 chữ số
 */
const sendWelcomeOtpEmail = async (to, fullName, otp) => {
  const subject = '🎉 Chào mừng bạn! Xác thực tài khoản - Tour Booking Platform';
  const html = buildWelcomeOtpTemplate(fullName, otp);
  await sendMail(to, subject, html);
};

/**
 * Gửi email mã OTP khôi phục mật khẩu
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 */
const sendForgotPasswordEmail = async (to, otp) => {
  const subject = '🔑 Khôi phục mật khẩu - Tour Booking Platform';
  const html = buildForgotPasswordTemplate(otp);
  await sendMail(to, subject, html);
};

module.exports = {
  sendWelcomeOtpEmail,
  sendForgotPasswordEmail,
};
