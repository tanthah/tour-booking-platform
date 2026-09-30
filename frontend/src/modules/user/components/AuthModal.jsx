import { useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OtpVerification from './OtpVerification';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import '../../../assets/styles/authModal.css';

/**
 * AuthModal Component - Modal Container hiển thị giao diện xác thực với nền hiệu ứng Backdrop Blur
 * Hiển thị đè lên nội dung trang hiện tại, hỗ trợ bấm phím Escape hoặc Click Backdrop để đóng
 */
const AuthModal = ({ isOpen, currentView, sharedEmail, onClose, onSwitchView, onLoginSuccess }) => {
  // Lắng nghe sự kiện bàn phím phím Escape để tự động đóng Modal Popup
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Xử lý đóng Modal khi người dùng click ra vùng phông nền bên ngoài Card (Backdrop Click)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Render động Form tương ứng dựa vào giá trị currentView
  const renderForm = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onSwitchToRegister={() => onSwitchView('register')}
            onSwitchToForgot={() => onSwitchView('forgot')}
            onLoginSuccess={onLoginSuccess}
            onClose={onClose}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onSwitchToLogin={() => onSwitchView('login')}
            onRegisterSuccess={(email) => onSwitchView('otp', email)}
          />
        );
      case 'otp':
        return (
          <OtpVerification
            email={sharedEmail}
            onVerifySuccess={() => onSwitchView('login')}
            onSwitchToLogin={() => onSwitchView('login')}
          />
        );
      case 'forgot':
        return (
          <ForgotPassword
            onSwitchToLogin={() => onSwitchView('login')}
            onOtpSent={(email) => onSwitchView('reset', email)}
          />
        );
      case 'reset':
        return (
          <ResetPassword
            email={sharedEmail}
            onResetSuccess={() => onSwitchView('login')}
            onSwitchToLogin={() => onSwitchView('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal-card">
        <button className="auth-modal-close" onClick={onClose} aria-label="Đóng">
          ✕
        </button>
        {renderForm()}
      </div>
    </div>
  );
};

export default AuthModal;
