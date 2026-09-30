import axiosClient from '../../config/axiosClient';

/**
 * Service Client tập trung quản lý các API Call liên quan đến Phân hệ User & Authentication
 */
const userService = {
  /**
   * API Đăng ký tài khoản Customer mới
   * @param {object} data - Payload: { full_name, phone, email, password, confirm_password }
   */
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  /**
   * API Xác thực mã OTP 6 chữ số
   * @param {object} data - Payload: { email, otp }
   */
  verifyOtp: (data) => {
    return axiosClient.post('/auth/verify-otp', data);
  },

  /**
   * API Yêu cầu gửi lại mã OTP mới qua email
   * @param {object} data - Payload: { email, type }
   */
  resendOtp: (data) => {
    return axiosClient.post('/auth/resend-otp', data);
  },

  /**
   * API Đăng nhập tài khoản
   * @param {object} data - Payload: { email, password }
   */
  login: (data) => {
    return axiosClient.post('/auth/login', data);
  },

  /**
   * API Yêu cầu OTP khôi phục mật khẩu (Quên mật khẩu)
   * @param {object} data - Payload: { email }
   */
  forgotPassword: (data) => {
    return axiosClient.post('/auth/forgot-password', data);
  },

  /**
   * API Đặt lại mật khẩu mới
   * @param {object} data - Payload: { email, otp, new_password, confirm_password }
   */
  resetPassword: (data) => {
    return axiosClient.post('/auth/reset-password', data);
  },

  /**
   * API Lấy thông tin hồ sơ cá nhân (Profile) của User đang đăng nhập
   */
  getProfile: () => {
    return axiosClient.get('/auth/me');
  },

  /**
   * API Đăng xuất tài khoản
   */
  logout: () => {
    return axiosClient.post('/auth/logout');
  },
};

export default userService;
