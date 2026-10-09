import { useState, useRef, useEffect } from 'react';
import userService from '../userService';

/**
 * ResetPassword Component - Form Đặt lại mật khẩu mới
 * Quy trình: Nhập mã OTP 6 chữ số + Mật khẩu mới + Xác nhận mật khẩu mới
 */
const ResetPassword = ({ email, onResetSuccess, onSwitchToLogin }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto focus ô OTP đầu tiên
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Xử lý OTP input
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (error) setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      inputRefs.current[5].focus();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (error) setError('');
  };

  const validate = () => {
    const errors = {};
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      errors.otp = 'Vui lòng nhập đủ 6 chữ số OTP';
    }

    if (!formData.new_password) {
      errors.new_password = 'Mật khẩu mới là bắt buộc';
    } else if (formData.new_password.length < 6) {
      errors.new_password = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }

    if (!formData.confirm_password) {
      errors.confirm_password = 'Vui lòng nhập lại mật khẩu mới';
    } else if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = 'Mật khẩu nhập lại không khớp';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userService.resetPassword({
        email,
        otp: otp.join(''),
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      setSuccess('Đổi mật khẩu thành công! Đang chuyển sang đăng nhập...');

      setTimeout(() => {
        onResetSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResend = async () => {
    try {
      await userService.resendOtp({ email, type: 'FORGOT_PASSWORD' });
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess('Mã OTP mới đã được gửi tới email của bạn');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Gửi lại OTP thất bại.');
    }
  };

  return (
    <div className="auth-form-active">
      <div className="auth-modal-header">
        <h2>Đổi mật khẩu</h2>
        <p>
          Nhập mã OTP đã gửi tới <strong style={{ color: '#667eea' }}>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="auth-alert error">
          <span>⚠</span> {error}
        </div>
      )}

      {success && (
        <div className="auth-alert success">
          <span>✓</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* OTP 6 ô */}
        <div className="otp-inputs" style={{ marginBottom: '8px' }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`otp-input ${digit ? 'filled' : ''} ${fieldErrors.otp ? 'error' : ''}`}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={index === 0 ? handleOtpPaste : undefined}
              disabled={loading || !!success}
            />
          ))}
        </div>
        {fieldErrors.otp && (
          <div className="auth-form-error" style={{ textAlign: 'center', marginBottom: '12px' }}>
            ⚠ {fieldErrors.otp}
          </div>
        )}

        {/* Countdown & Resend */}
        <div className="otp-timer" style={{ textAlign: 'center' }}>
          {!canResend ? (
            <>
              Hết hạn sau <span className="countdown">{formatTime(countdown)}</span>
            </>
          ) : (
            <button type="button" className="otp-resend-btn" onClick={handleResend} disabled={loading}>
              Gửi lại mã OTP
            </button>
          )}
        </div>

        {/* Mật khẩu mới */}
        <div className="auth-form-group">
          <label htmlFor="reset-new-password">Mật khẩu mới</label>
          <div className="password-wrapper">
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              name="new_password"
              className={`auth-form-input ${fieldErrors.new_password ? 'is-invalid' : ''}`}
              placeholder="••••••"
              value={formData.new_password}
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
          {fieldErrors.new_password && (
            <div className="auth-form-error">⚠ {fieldErrors.new_password}</div>
          )}
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="auth-form-group">
          <label htmlFor="reset-confirm-password">Xác nhận mật khẩu</label>
          <div className="password-wrapper">
            <input
              id="reset-confirm-password"
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

        <button type="submit" className="auth-submit-btn" disabled={loading || !!success}>
          {loading && <span className="spinner" />}
          {loading ? 'Đang xử lý...' : 'Thay đổi'}
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

export default ResetPassword;
