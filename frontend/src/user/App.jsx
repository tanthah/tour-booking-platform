import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TourListPage from './pages/TourListPage';
import TourDetailPage from './pages/TourDetailPage';
import CartPage from './pages/CartPage';
import AuthModal from './modules/user/components/AuthModal';
import useAuthModal from './modules/user/useAuthModal';

import AdminApp from '../admin/App';

/**
 * Root Component App - Quản lý Routing và trạng thái xác thực toàn cục
 */
function App() {
  const { isOpen, currentView, sharedEmail, openModal, closeModal, switchView } = useAuthModal();
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  // Callback Handler khi đăng nhập thành công
  const handleLoginSuccess = useCallback((data) => {
    // LoginForm truyền vào response.data (là { token, user })
    // vì axiosClient interceptor đã unwrap response.data rồi
    const loggedInUser = data?.user || {};
    setUser(loggedInUser);
    window.dispatchEvent(new Event('cartUpdated'));

    // Chuyển hướng sang trang quản lý nếu là ADMIN hoặc STAFF
    const isAdmin = Array.isArray(loggedInUser.roles) && loggedInUser.roles.includes('ADMIN');
    const isStaff = Array.isArray(loggedInUser.roles) && loggedInUser.roles.includes('STAFF');

    if (isAdmin || isStaff) {
      window.location.href = '/admin';
    }
  }, []);

  // Callback Handler Đăng xuất
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  return (
    <Router>
      <Routes>
        {/* Route dành cho Admin */}
        <Route path="/admin/*" element={<AdminApp />} />
        
        {/* Route dành cho Client */}
        <Route path="/*" element={
          <>
            <Header
              user={user}
              onOpenLogin={() => openModal('login')}
              onOpenRegister={() => openModal('register')}
              onLogout={handleLogout}
            />
            <div style={{ paddingTop: '102px', minHeight: 'calc(100vh - 350px)' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tour-trong-nuoc" element={<TourListPage categoryType="domestic" />} />
                <Route path="/tour-trong-nuoc/:region" element={<TourListPage categoryType="domestic" />} />
                <Route path="/tour-nuoc-ngoai" element={<TourListPage categoryType="international" />} />
                <Route path="/tour-nuoc-ngoai/:region" element={<TourListPage categoryType="international" />} />
                <Route path="/tours" element={<TourListPage categoryType="domestic" />} />
                <Route path="/tour/:id" element={<TourDetailPage />} />
                <Route path="/tours/:id" element={<TourDetailPage />} />
                <Route path="/gio-hang" element={<CartPage />} />
              </Routes>
            </div>
            <Footer />
          </>
        } />
      </Routes>

      {/* Auth Modal Popup */}
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
