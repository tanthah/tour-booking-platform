import { useState } from 'react';
import userService from '../userService';

/**
 * LoginForm Component - Form Đăng nhập hệ thống
 * Sau khi đăng nhập thành công: Lưu JWT Token & User Info vào LocalStorage và giữ nguyên trang hiện tại
 */
const LoginForm = ({ onSwitchToRegister, onSwitchToForgot, onLoginSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Handler xử lý thay đổi giá trị Input và xóa lỗi trường tương ứng
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Xóa lỗi tại trường đó khi user bắt đầu nhập lại
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
    if (error) setError('');
  };

  // Client-side Validation trước khi gọi API
  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email là bắt buộc';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Email không hợp lệ';
    if (!formData.password) errors.password = 'Mật khẩu là bắt buộc';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler xử lý Form Submit đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      const response = await userService.login({
        email: formData.email,
        password: formData.password,
      });

      // Luu Token va thong tin User vao LocalStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Kich hoat callback chuyen huong truoc, sau do moi dong Modal
      if (onLoginSuccess) {
        onLoginSuccess(response.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Dang nhap that bai. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-active">
      <div className="auth-modal-header">
        <h2>Chào mừng bạn trở lại </h2>
        <p>Vui lòng đăng nhập email và mật khẩu để tiếp tục</p>
      </div>

      {error && (
        <div className="auth-alert error">
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            name="email"
            className={`auth-form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
            placeholder="Ví dụ: lovana@gmail.com"
            value={formData.email}
            onChange={handleChange}
            autoFocus
          />
          {fieldErrors.email && (
            <div className="auth-form-error">⚠ {fieldErrors.email}</div>
          )}
        </div>

        <div className="auth-form-group">
          <label htmlFor="login-password">Mật khẩu</label>
          <div className="password-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`auth-form-input ${fieldErrors.password ? 'is-invalid' : ''}`}
              placeholder="••••••"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {fieldErrors.password && (
            <div className="auth-form-error">⚠ {fieldErrors.password}</div>
          )}
        </div>

        <div className="auth-checkbox-row">
          <label>
            <input
              type="checkbox"
              name="remember_me"
              checked={formData.remember_me}
              onChange={handleChange}
            />
            Nhớ mật khẩu
          </label>
          <span className="auth-link" onClick={onSwitchToForgot}>
            Quên mật khẩu?
          </span>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
        </button>
      </form>

      <div className="auth-footer">
        Bạn chưa có tài khoản?{' '}
        <span className="auth-link" onClick={onSwitchToRegister}>
          Đăng ký
        </span>
      </div>
    </div>
  );
};

export default LoginForm;
