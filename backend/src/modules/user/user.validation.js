const { body } = require('express-validator');

/**
 * Validation rules cho chức năng Đăng ký tài khoản (Register Validation Schema)
 */
const registerValidation = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Họ và tên là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ và tên phải từ 2 đến 100 ký tự'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .matches(/^(0[35789])[0-9]{8}$/)
    .withMessage('Số điện thoại không hợp lệ (phải đúng 10 số, VD: 0912345678)'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"|,.<>\/?]).{8,}$/)
    .withMessage('Mật khẩu phải chứa chữ thường, chữ hoa, số và ký tự đặc biệt'),

  body('confirm_password')
    .notEmpty()
    .withMessage('Vui lòng nhập lại mật khẩu')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu nhập lại không khớp');
      }
      return true;
    }),
];

/**
 * Validation rules cho chức năng Đăng nhập (Login Validation Schema)
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
];

/**
 * Validation rules cho chức năng Xác thực OTP (Verify OTP Validation Schema)
 */
const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải gồm 6 chữ số')
    .isNumeric()
    .withMessage('Mã OTP chỉ chứa chữ số'),
];

/**
 * Validation rules cho chức năng Gửi lại OTP (Resend OTP Validation Schema)
 */
const resendOtpValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Loại OTP là bắt buộc')
    .isIn(['REGISTER', 'FORGOT_PASSWORD'])
    .withMessage('Loại OTP không hợp lệ'),
];

/**
 * Validation rules cho chức năng Quên mật khẩu (Forgot Password Validation Schema)
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
];

/**
 * Validation rules cho chức năng Đặt lại mật khẩu (Reset Password Validation Schema)
 */
const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải gồm 6 chữ số'),

  body('new_password')
    .notEmpty()
    .withMessage('Mật khẩu mới là bắt buộc')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"|,.<>\/?]).{8,}$/)
    .withMessage('Mật khẩu mới phải chứa chữ thường, chữ hoa, số và ký tự đặc biệt'),

  body('confirm_password')
    .notEmpty()
    .withMessage('Vui lòng nhập lại mật khẩu mới')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Mật khẩu nhập lại không khớp');
      }
      return true;
    }),
];

module.exports = {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
