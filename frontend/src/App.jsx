import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AuthModal from './modules/user/components/AuthModal';
import useAuthModal from './modules/user/useAuthModal';

/**
 * Root Component App - Quản lý Routing và trạng thái xác thực toàn cục
 *
 * Luồng Auth Modal & State:
 * - Modal hiển thị Overlay đè lên giao diện hiện tại với nền trong suốt (Glassmorphism Modal)
 * - Đăng ký -> Nhập OTP -> Xác thực OTP -> Chuyển sang Form Đăng nhập
 * - Đăng nhập thành công -> Đóng Modal, cập nhật State User và giữ nguyên trang/trạng thái hiện tại
 */
function App() {
  const { isOpen, currentView, sharedEmail, openModal, closeModal, switchView } = useAuthModal();
  const [user, setUser] = useState(null);

  // Khôi phục thông tin User từ LocalStorage khi App mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Callback Handler khi Đăng nhập thành công: Cập nhật State User mà không redirect trang
  const handleLoginSuccess = useCallback((data) => {
    setUser(data.user);
  }, []);

  // Callback Handler Đăng xuất: Xóa Token & User trong LocalStorage, reset State
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <Router>
      {/* Header Navigation hiển thị cố định ở đầu trang */}
      <Header
        user={user}
        onOpenLogin={() => openModal('login')}
        onOpenRegister={() => openModal('register')}
        onLogout={handleLogout}
      />

      {/* Main Content Area - Render nội dung các Route */}
      <div style={{ paddingTop: '72px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Các Route khác sẽ được mở rộng theo từng Module */}
        </Routes>
      </div>

      {/* Auth Modal Popup - Hiển thị đè lên nội dung trang chính */}
      <AuthModal
        isOpen={isOpen}
        currentView={currentView}
        sharedEmail={sharedEmail}
        onClose={closeModal}
        onSwitchView={switchView}
        onLoginSuccess={handleLoginSuccess}
      />
    </Router>
  );
}

export default App;
