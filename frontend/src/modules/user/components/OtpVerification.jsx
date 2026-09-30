import { useState, useRef, useEffect, useCallback } from 'react';
import userService from '../userService';

/**
 * OtpVerification Component - Form nhập mã OTP 6 ô chữ số độc lập
 * Tính năng trải nghiệm người dùng (UX Features):
 * - Tự động Focus chuyển sang ô tiếp theo khi gõ chữ số
 * - Tự động Focus lùi lại ô trước khi nhấn phím Backspace
 * - Hỗ trợ Clipboard Paste toàn bộ chuỗi 6 chữ số OTP
 * - Bộc lộ Đếm ngược Countdown Timer 60 giây
 * - Nút Yêu cầu gửi lại mã OTP
 *
 * Sau khi xác thực thành công: Tự động chuyển qua Form Đăng nhập
 */
const OtpVerification = ({ email, onVerifySuccess, onSwitchToLogin }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  // Auto focus ô đầu tiên
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Format countdown hiển thị mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Xử lý khi nhập số vào 1 ô
  const handleChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Tự động chuyển sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Tự động submit khi đủ 6 số
    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  // Xử lý phím Backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Nếu ô hiện tại rỗng, lùi về ô trước và xóa
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Xử lý Paste chuỗi 6 số
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Kiểm tra là chuỗi 6 chữ số
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      setError('');

      // Focus ô cuối cùng
      inputRefs.current[5].focus();

      // Tự động submit
      handleVerify(pastedData);
    }
  }, []);

  // Gọi API xác thực OTP
  const handleVerify = async (otpCode) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userService.verifyOtp({ email, otp: otpCode });

      setSuccess('Xác thực thành công! Đang chuyển sang đăng nhập...');

      // Delay 1.5s rồi chuyển sang form login
      setTimeout(() => {
        onVerifySuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.');
      // Clear OTP và focus ô đầu
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Form submit thủ công (khi bấm nút)
  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    handleVerify(otpCode);
  };

  // Gửi lại OTP
  const handleResend = async () => {
    try {
      await userService.resendOtp({ email, type: 'REGISTER' });
      setCountdown(60);
      setCanResend(false);
      setError('');
      setSuccess('Mã OTP mới đã được gửi tới email của bạn');
      // Clear ô OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Gửi lại OTP thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="auth-form-active otp-container">
      <div className="auth-modal-header">
        <h2>Xác thực OTP</h2>
        <p>
          Mã xác thực 6 số đã được gửi tới
          <br />
          <strong style={{ color: '#667eea' }}>{email}</strong>
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
        {/* 6 ô OTP */}
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`otp-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading || !!success}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Countdown timer */}
        <div className="otp-timer">
          {!canResend ? (
            <>
              Mã OTP hết hạn sau <span className="countdown">{formatTime(countdown)}</span>
            </>
          ) : (
            <span>Mã OTP đã hết hạn</span>
          )}
        </div>

        {/* Nút Gửi lại OTP */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            className="otp-resend-btn"
            onClick={handleResend}
            disabled={!canResend || loading}
          >
            Gửi lại mã OTP
          </button>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading || otp.join('').length !== 6 || !!success}>
          {loading && <span className="spinner" />}
          {loading ? 'Đang xác thực...' : 'Xác nhận'}
        </button>
      </form>

      <div className="auth-footer">
        <span className="auth-link" onClick={onSwitchToLogin}>
          Quay lại đăng nhập
        </span>
      </div>
    </div>
  );
};

export default OtpVerification;
