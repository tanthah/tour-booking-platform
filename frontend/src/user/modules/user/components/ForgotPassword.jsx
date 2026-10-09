import { useState } from 'react';
import userService from '../userService';

/**
 * ForgotPassword Component - Form Quên mật khẩu
 * Quy trình: Nhập Email -> Gửi OTP khôi phục -> Chuyển sang Form ResetPassword
 */
const ForgotPassword = ({ onSwitchToLogin, onOtpSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phía frontend
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      await userService.forgotPassword({ email: email.trim().toLowerCase() });

      // Chuyển sang form đổi mật khẩu (kèm email)
      onOtpSent(email.trim().toLowerCase());
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-active">
      <div className="auth-modal-header">
        <h2>Quên mật khẩu</h2>
        <p>Vui lòng nhập email để tiếp tục</p>
      </div>

      {error && (
        <div className="auth-alert error">
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            className="auth-form-input"
            placeholder="Ví dụ: lovana@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            required
            autoFocus
          />
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
        </button>
      </form>

      <div className="auth-footer">
        Bạn đã nhớ mật khẩu?{' '}
        <span className="auth-link" onClick={onSwitchToLogin}>
          Đăng nhập
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;
