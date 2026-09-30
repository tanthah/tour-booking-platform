import { useState } from 'react';
import userService from '../userService';

/**
 * RegisterForm Component - Form Đăng ký tài khoản Customer (gồm 5 trường thông tin)
 * Sau khi đăng ký thành công: Tự động chuyển qua Form xác thực OTP
 */
const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Handler thay đổi giá trị Input và làm sạch thông báo lỗi tại trường tương ứng
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (error) setError('');
  };

  // Client-side Validation Handler trước khi thực hiện API Call
  const validateForm = () => {
    const errors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Họ và tên là bắt buộc';
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[35789])[0-9]{8}$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ (phải đúng 10 số, VD: 0912345678)';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email là bắt buộc';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"|,.<>\/?]).{8,}$/.test(formData.password)) {
      errors.password = 'Mật khẩu phải chứa chữ thường, chữ hoa, số và ký tự đặc biệt';
    }

    if (!formData.confirm_password) {
      errors.confirm_password = 'Vui lòng nhập lại mật khẩu';
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Mật khẩu nhập lại không khớp';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler xử lý submit Form đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Thực hiện Validate phía Frontend trước
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await userService.register({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      // Đăng ký thành công -> Chuyển sang Form nhập OTP xác thực
      onRegisterSuccess(formData.email.trim().toLowerCase());
    } catch (err) {
      // Xử lý lỗi validation từ backend
      if (err.errors && err.errors.length > 0) {
        const backendErrors = {};
        err.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setFieldErrors(backendErrors);
      }
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-active">
      <div className="auth-modal-header">
        <h2>Đăng ký</h2>
        <p>Tạo một tài khoản để tiếp tục</p>
      </div>

      {error && (
        <div className="auth-alert error">
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Họ tên */}
        <div className="auth-form-group">
          <label htmlFor="register-fullname">Họ tên</label>
          <input
            id="register-fullname"
            type="text"
            name="full_name"
            className={`auth-form-input ${fieldErrors.full_name ? 'is-invalid' : ''}`}
            placeholder="Ví dụ: Lê Văn A"
            value={formData.full_name}
            onChange={handleChange}
          />
          {fieldErrors.full_name && (
            <div className="auth-form-error">⚠ {fieldErrors.full_name}</div>
          )}
        </div>

        {/* Số điện thoại */}
        <div className="auth-form-group">
          <label htmlFor="register-phone">Số điện thoại</label>
          <input
            id="register-phone"
            type="tel"
            name="phone"
            className={`auth-form-input ${fieldErrors.phone ? 'is-invalid' : ''}`}
            placeholder="Ví dụ: 0912345678"
            value={formData.phone}
            onChange={handleChange}
          />
          {fieldErrors.phone && (
            <div className="auth-form-error">⚠ {fieldErrors.phone}</div>
          )}
        </div>

        {/* Email */}
        <div className="auth-form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            name="email"
            className={`auth-form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
            placeholder="Ví dụ: lovana@gmail.com"
            value={formData.email}
            onChange={handleChange}
          />
          {fieldErrors.email && (
            <div className="auth-form-error">⚠ {fieldErrors.email}</div>
          )}
        </div>

        {/* Mật khẩu */}
        <div className="auth-form-group">
          <label htmlFor="register-password">Mật khẩu</label>
          <div className="password-wrapper">
            <input
              id="register-password"
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

        {/* Nhập lại mật khẩu */}
        <div className="auth-form-group">
          <label htmlFor="register-confirm-password">Nhập lại mật khẩu</label>
          <div className="password-wrapper">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm_password"
              className={`auth-form-input ${fieldErrors.confirm_password ? 'is-invalid' : ''}`}
              placeholder="••••••"
              value={formData.confirm_password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? '🙈' : '👁'}
            </button>
          </div>
          {fieldErrors.confirm_password && (
            <div className="auth-form-error">⚠ {fieldErrors.confirm_password}</div>
          )}
        </div>


        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
        </button>
      </form>

      <div className="auth-footer">
        Bạn đã có tài khoản?{' '}
        <span className="auth-link" onClick={onSwitchToLogin}>
          Đăng nhập
        </span>
      </div>
    </div>
  );
};

export default RegisterForm;
