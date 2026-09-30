const { validationResult } = require('express-validator');
const userService = require('./user.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Hàm helper kiểm tra và xử lý lỗi Validation từ express-validator
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
    return false;
  }
  return true;
};

/**
 * Controller: Đăng ký tài khoản Customer mới
 * HTTP Method: POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { full_name, phone, email, password } = req.body;
  const result = await userService.register({ full_name, phone, email, password });

  ApiResponse.success(res, 201, 'Đăng ký thành công. Mã OTP đã được gửi tới email của bạn.', result);
});

/**
 * Controller: Xác thực mã OTP 6 chữ số
 * HTTP Method: POST /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, otp } = req.body;
  const result = await userService.verifyOtp({ email, otp });

  ApiResponse.success(res, 200, result.message, null);
});

/**
 * Controller: Yêu cầu gửi lại mã OTP mới
 * HTTP Method: POST /api/auth/resend-otp
 */
const resendOtp = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, type } = req.body;
  const result = await userService.resendOtp({ email, type });

  ApiResponse.success(res, 200, result.message, null);
});

/**
 * Controller: Đăng nhập hệ thống (Sinh JWT Access Token)
 * HTTP Method: POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, password } = req.body;
  const result = await userService.login({ email, password });

  ApiResponse.success(res, 200, 'Đăng nhập thành công', result);
});

/**
 * Controller: Yêu cầu mã OTP khôi phục mật khẩu (Quên mật khẩu)
 * HTTP Method: POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email } = req.body;
  const result = await userService.forgotPassword({ email });

  ApiResponse.success(res, 200, result.message, null);
});

/**
 * Controller: Đặt lại mật khẩu mới bằng mã OTP
 * HTTP Method: POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, otp, new_password } = req.body;
  const result = await userService.resetPassword({ email, otp, new_password });

  ApiResponse.success(res, 200, result.message, null);
});

/**
 * Controller: Lấy thông tin hồ sơ người dùng đăng nhập (Profile)
 * HTTP Method: GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  ApiResponse.success(res, 200, 'Lấy thông tin thành công', user);
});

/**
 * Controller: Cập nhật thông tin hồ sơ người dùng (Profile)
 * HTTP Method: PATCH /api/auth/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật thông tin thành công', user);
});

/**
 * Controller: Đăng xuất người dùng
 * HTTP Method: POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // JWT là Stateless token, phía Client/Frontend sẽ chịu trách nhiệm tự xóa token khỏi Storage
  ApiResponse.success(res, 200, 'Đăng xuất thành công', null);
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  logout,
};
