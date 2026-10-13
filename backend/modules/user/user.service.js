const jwt = require('jsonwebtoken');
const User = require('./user.model');
const OtpVerification = require('./otp.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');
const { generateOTP } = require('../../utils/otpGenerator');
const { sendWelcomeOtpEmail, sendForgotPasswordEmail } = require('../email/email.service');

class UserService {
  /**
   * Đăng ký tài khoản người dùng mới (Role CUSTOMER)
   * Tạo User với trạng thái PENDING_VERIFICATION và gửi mã OTP xác thực qua Email
   */
  async register({ full_name, phone, email, password }) {
    // Kiểm tra xem Email đã tồn tại trong DB chưa
    const existingEmail = await User.findOne({ email, deleted_at: null });
    if (existingEmail) {
      const error = new Error('Email đã được sử dụng');
      error.statusCode = 409;
      throw error;
    }

    // Kiểm tra xem Số điện thoại đã tồn tại trong DB chưa
    const existingPhone = await User.findOne({ phone, deleted_at: null });
    if (existingPhone) {
      const error = new Error('Số điện thoại đã được sử dụng');
      error.statusCode = 409;
      throw error;
    }

    // Khởi tạo User mới với status PENDING_VERIFICATION
    const user = new User({
      full_name,
      phone,
      email,
      password_hash: password, // Mật khẩu sẽ được mã hóa tự động bởi Mongoose pre-save hook
      status: 'PENDING_VERIFICATION',
      roles: ['CUSTOMER'],
    });

    await user.save();

    // Sinh mã OTP 6 số và gửi email chào mừng kèm OTP
    await this._createAndSendOtp(email, 'REGISTER', full_name);

    return { email: user.email };
  }

  /**
   * Xác thực mã OTP người dùng nhập
   * Kiểm tra thời hạn, số lần thử và kích hoạt trạng thái tài khoản thành ACTIVE
   */
  async verifyOtp({ email, otp }) {
    const otpRecord = await OtpVerification.findOne({
      email,
      type: 'REGISTER',
      is_used: false,
      expires_at: { $gt: new Date() },
    });

    if (!otpRecord) {
      const error = new Error('Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu gửi lại mã.');
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra giới hạn tối đa 5 lần nhập sai OTP
    if (otpRecord.attempts >= 5) {
      const error = new Error('Đã vượt quá số lần thử cho phép. Vui lòng yêu cầu gửi lại mã OTP mới.');
      error.statusCode = 429;
      throw error;
    }

    // So sánh đối chiếu mã OTP nhập vào
    if (otpRecord.otp_code !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const error = new Error(`Mã OTP không đúng. Bạn còn ${5 - otpRecord.attempts} lần thử.`);
      error.statusCode = 400;
      throw error;
    }

    // Đánh dấu mã OTP đã sử dụng thành công
    otpRecord.is_used = true;
    await otpRecord.save();

    // Kích hoạt tài khoản User sang trạng thái ACTIVE
    await User.findOneAndUpdate(
      { email, deleted_at: null },
      { status: 'ACTIVE' }
    );

    return { message: 'Xác thực thành công. Vui lòng đăng nhập.' };
  }

  // Gửi lại mã OTP mới cho người dùng

  async resendOtp({ email, type }) {
    // Kiểm tra tính tồn tại của tài khoản User
    const user = await User.findOne({ email, deleted_at: null });
    if (!user) {
      const error = new Error('Email không tồn tại trong hệ thống');
      error.statusCode = 404;
      throw error;
    }

    // Hủy / Xóa các bản ghi OTP cũ chưa được sử dụng
    await OtpVerification.deleteMany({ email, type, is_used: false });

    // Tạo và phát hành mã OTP mới qua Email
    await this._createAndSendOtp(email, type);

    return { message: 'Mã OTP mới đã được gửi tới email của bạn' };
  }

  // Đăng nhập người dùng và khởi tạo JWT Access Token

  async login({ email, password }) {
    // Tìm kiếm User chưa bị xóa mềm trong CSDL
    const user = await User.findOne({ email, deleted_at: null });

    if (!user) {
      const error = new Error('Email hoặc mật khẩu không đúng');
      error.statusCode = 401;
      throw error;
    }

    // Kiểm tra trạng thái kích hoạt của tài khoản (Status Check)
    if (user.status === 'PENDING_VERIFICATION') {
      const error = new Error('Tài khoản chưa được xác thực. Vui lòng kiểm tra email để nhận mã OTP.');
      error.statusCode = 403;
      throw error;
    }

    if (user.status === 'LOCKED') {
      const error = new Error('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
      error.statusCode = 403;
      throw error;
    }

    if (user.status === 'INACTIVE') {
      const error = new Error('Tài khoản đã bị vô hiệu hóa.');
      error.statusCode = 403;
      throw error;
    }

    // So sánh mật khẩu plain-text người dùng nhập với Bcrypt Hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Email hoặc mật khẩu không đúng');
      error.statusCode = 401;
      throw error;
    }

    // Tạo JWT Access Token
    const token = this._generateToken(user._id);

    return {
      token,
      user: user.toJSON(),
    };
  }

  /**
   * Yêu cầu khôi phục mật khẩu - Gửi mã OTP khôi phục qua Email
   */
  async forgotPassword({ email }) {
    const user = await User.findOne({ email, deleted_at: null, status: 'ACTIVE' });
    if (!user) {
      const error = new Error('Email không tồn tại hoặc tài khoản chưa được kích hoạt');
      error.statusCode = 404;
      throw error;
    }

    // Xóa bỏ các OTP quên mật khẩu cũ chưa sử dụng
    await OtpVerification.deleteMany({ email, type: 'FORGOT_PASSWORD', is_used: false });

    // Tạo và gửi mã OTP khôi phục mật khẩu mới
    await this._createAndSendOtp(email, 'FORGOT_PASSWORD');

    return { message: 'Mã OTP đã được gửi tới email của bạn' };
  }

  /**
   * Đặt lại mật khẩu mới thông qua mã OTP xác thực
   */
  async resetPassword({ email, otp, new_password }) {
    // Truy vấn và xác thực mã OTP
    const otpRecord = await OtpVerification.findOne({
      email,
      type: 'FORGOT_PASSWORD',
      is_used: false,
      expires_at: { $gt: new Date() },
    });

    if (!otpRecord) {
      const error = new Error('Mã OTP không tồn tại hoặc đã hết hạn');
      error.statusCode = 400;
      throw error;
    }

    if (otpRecord.attempts >= 5) {
      const error = new Error('Đã vượt quá số lần thử cho phép. Vui lòng yêu cầu gửi lại mã OTP.');
      error.statusCode = 429;
      throw error;
    }

    if (otpRecord.otp_code !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const error = new Error(`Mã OTP không đúng. Bạn còn ${5 - otpRecord.attempts} lần thử.`);
      error.statusCode = 400;
      throw error;
    }

    // Đánh dấu mã OTP đã được sử dụng
    otpRecord.is_used = true;
    await otpRecord.save();

    // Cập nhật mật khẩu mới cho User
    const user = await User.findOne({ email, deleted_at: null });
    if (!user) {
      const error = new Error('Tài khoản không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    user.password_hash = new_password; // Mật khẩu mới sẽ được mã hóa tự động bởi pre-save hook
    await user.save();

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  /**
   * Lấy thông tin chi tiết hồ sơ cá nhân người dùng (Profile)
   */
  async getProfile(userId) {
    const user = await User.findOne({ _id: userId, deleted_at: null }).select('-password_hash');
    if (!user) {
      const error = new Error('Tài khoản không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Cập nhật thông tin hồ sơ cá nhân người dùng (Profile)
   */
  async updateProfile(userId, updateData) {
    // Chỉ lọc các trường thông tin cho phép cập nhật (Whitelist)
    const allowedFields = ['full_name', 'phone', 'avatar_url', 'date_of_birth', 'address'];
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const user = await User.findOneAndUpdate(
      { _id: userId, deleted_at: null },
      filteredData,
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (!user) {
      const error = new Error('Tài khoản không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  // ============ PRIVATE HELPER METHODS ============

  /**
   * Helper Private Method: Sinh mã OTP, lưu DB và gửi Email theo loại
   * @param {string} email - Email người nhận
   * @param {string} type - 'REGISTER' hoặc 'FORGOT_PASSWORD'
   * @param {string} fullName - Tên user (chỉ dùng cho email REGISTER)
   */
  async _createAndSendOtp(email, type, fullName = '') {
    const otp = generateOTP();

    await OtpVerification.create({
      email,
      otp_code: otp,
      type,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Gọi đúng hàm gửi email theo mục đích
    if (type === 'REGISTER') {
      await sendWelcomeOtpEmail(email, fullName, otp);
    } else {
      await sendForgotPasswordEmail(email, otp);
    }
  }

  /**
   * Helper Private Method: Ký tạo JWT Access Token bằng JWT_SECRET
   */
  _generateToken(userId) {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}

module.exports = new UserService();
