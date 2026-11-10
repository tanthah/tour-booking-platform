const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('./user.validation');

// ============ PUBLIC ROUTES (Không yêu cầu xác thực JWT) ============

// Endpoint Đăng ký tài khoản Customer mới
router.post('/register', registerValidation, userController.register);

// Endpoint Xác thực mã OTP 6 chữ số
router.post('/verify-otp', verifyOtpValidation, userController.verifyOtp);

// Endpoint Yêu cầu gửi lại mã OTP mới
router.post('/resend-otp', resendOtpValidation, userController.resendOtp);

// Endpoint Đăng nhập tài khoản
router.post('/login', loginValidation, userController.login);

// Endpoint Yêu cầu khôi phục mật khẩu (Quên mật khẩu)
router.post('/forgot-password', forgotPasswordValidation, userController.forgotPassword);

// Endpoint Đặt lại mật khẩu mới với mã OTP
router.post('/reset-password', resetPasswordValidation, userController.resetPassword);

// ============ PROTECTED ROUTES (Yêu cầu JWT Authentication Middleware) ============

// Endpoint Đăng xuất tài khoản
router.post('/logout', authenticate, userController.logout);

// Endpoint Lấy thông tin hồ sơ người dùng hiện tại (Profile)
router.get('/me', authenticate, userController.getProfile);

// Endpoint Cập nhật thông tin hồ sơ cá nhân (Profile)
router.patch('/me', authenticate, upload.single('avatar'), userController.updateProfile);

module.exports = router;
