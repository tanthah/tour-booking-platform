import { useState, useCallback } from 'react';

/**
 * Custom Hook quản lý State mở/đóng AuthModal và luồng chuyển đổi giao diện giữa các Form
 *
 * Danh sách các View màn hình hỗ trợ:
 * - 'login': Form Đăng nhập
 * - 'register': Form Đăng ký
 * - 'otp': Form nhập mã OTP 6 chữ số
 * - 'forgot': Form Quên mật khẩu
 * - 'reset': Form Đặt lại mật khẩu mới
 */
const useAuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  // State lưu trữ Email chia sẻ giữa các bước (ví dụ: Đăng ký -> OTP, Quên MK -> Đổi MK)
  const [sharedEmail, setSharedEmail] = useState('');

  // Hàm mở Modal với Giao diện (View) được chỉ định
  const openModal = useCallback((view = 'login') => {
    setCurrentView(view);
    setIsOpen(true);
    // Vô hiệu hóa thanh cuộn (Scrollbar) của trang khi Modal đang hiển thị
    document.body.style.overflow = 'hidden';
  }, []);

  // Hàm đóng Modal và reset các State liên quan về mặc định
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentView('login');
    setSharedEmail('');
    // Khôi phục trạng thái thanh cuộn (Scrollbar) của trang
    document.body.style.overflow = '';
  }, []);

  // Hàm chuyển đổi linh hoạt giữa các View màn hình trong Modal
  const switchView = useCallback((view, email = '') => {
    setCurrentView(view);
    if (email) {
      setSharedEmail(email);
    }
  }, []);

  return {
    isOpen,
    currentView,
    sharedEmail,
    openModal,
    closeModal,
    switchView,
  };
};

export default useAuthModal;
