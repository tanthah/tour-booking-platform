import { useState, useEffect } from 'react';
import { Navbar, Container, Nav, NavDropdown, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import useCart from '../hooks/useCart';
import '../assets/styles/header.css';

/**
 * Header Component - Thanh điều hướng thương hiệu Tourn Go
 * Gồm 2 phần:
 * 1. Topbar màu cam: Hotline, Email, Địa chỉ
 * 2. Main Navbar: Logo Tourn Go, Menu (Trang Chủ, Tour Trong Nước, Tour Nước Ngoài, Tin Tức, Liên Hệ), Giỏ hàng và Đăng nhập/Đăng ký
 */
const Header = ({ user, onOpenLogin, onOpenRegister: _onOpenRegister, onLogout: _onLogout, settings }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { cart, fetchCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);

    // Lắng nghe sự kiện cập nhật giỏ hàng từ các component khác
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCart]);

  const cartCount = cart?.items?.length || 0;

  const isActive = (path) => location.pathname === path;
  const isTourActive = location.pathname.startsWith('/tour') || location.pathname.startsWith('/tours');
  const isPromotionActive = location.pathname === '/uu-dai' || location.pathname === '/khuyen-mai';

  return (
    <header className="fixed-top header-container">
      {/* 1. Top Bar Màu Cam (Thông tin liên hệ) */}
      <div className="header-topbar">
        <Container>
          <div className="d-flex flex-wrap justify-content-center justify-content-md-end align-items-center gap-3 gap-md-4">
            {/* Phone */}
            <a href={`tel:${settings?.phone || '0123456789'}`} className="header-topbar-item">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>{settings?.phone || '0123.456.789'}</span>
            </a>

            {/* Email */}
            <a href={`mailto:${settings?.email || 'contact@tourngo.com'}`} className="header-topbar-item">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span>{settings?.email || 'contact@tourngo.com'}</span>
            </a>

            {/* Address */}
            <span className="header-topbar-item d-none d-sm-inline-flex">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{settings?.address || 'Số 123, đường ABC, thành phố XYZ'}</span>
            </span>
          </div>
        </Container>
      </div>

      {/* 2. Main Navbar */}
      <Navbar
        expand="lg"
        className={`header-main-nav ${scrolled ? 'scrolled' : ''}`}
      >
        <Container>
          {/* Logo tour go */}
          <Navbar.Brand as={Link} to="/" className="p-0">
            <Logo height={65} logoUrl={settings?.logo_url} />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar-nav" />

          <Navbar.Collapse id="main-navbar-nav">
            {/* Menu chính */}
            <Nav className="mx-auto align-items-lg-center">
              <Nav.Link
                as={Link}
                to="/"
                className={`header-nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Trang Chủ
              </Nav.Link>

              {/* Dropdown Tour (Gộp Tour Trong Nước và Tour Nước Ngoài) */}
              <NavDropdown
                title="Tour"
                id="tours-dropdown"
                className={`header-nav-dropdown header-nav-link p-0 ${isTourActive ? 'active' : ''}`}
              >
                <div className="tour-dropdown-mega p-3">
                  <div className="d-flex flex-column flex-md-row gap-3">
                    {/* Cột 1: Tour Trong Nước */}
                    <div className="tour-dropdown-section">
                      <div className="tour-dropdown-header text-uppercase fw-bold mb-2">
                        <Link to="/tour-trong-nuoc" className="text-decoration-none" style={{ color: '#ea580c' }}>
                          Tour Trong Nước
                        </Link>
                      </div>
                      <NavDropdown.Item as={Link} to="/tour-trong-nuoc" className="tour-dropdown-subitem">
                        Tất cả Tour Trong Nước
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/tour-trong-nuoc/mien-bac" className="tour-dropdown-subitem">
                        Tour Miền Bắc
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/tour-trong-nuoc/mien-trung" className="tour-dropdown-subitem">
                        Tour Miền Trung
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/tour-trong-nuoc/mien-nam" className="tour-dropdown-subitem">
                        Tour Miền Nam
                      </NavDropdown.Item>
                    </div>

                    {/* Cột 2: Tour Nước Ngoài */}
                    <div className="tour-dropdown-section border-start ps-md-3">
                      <div className="tour-dropdown-header text-uppercase fw-bold mb-2">
                        <Link to="/tour-nuoc-ngoai" className="text-decoration-none" style={{ color: '#ea580c' }}>
                          Tour Nước Ngoài
                        </Link>
                      </div>
                      <NavDropdown.Item as={Link} to="/tour-nuoc-ngoai" className="tour-dropdown-subitem">
                        Tất cả Tour Nước Ngoài
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/tour-nuoc-ngoai/chau-a" className="tour-dropdown-subitem">
                        Tour Châu Á
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/tour-nuoc-ngoai/chau-au" className="tour-dropdown-subitem">
                        Tour Châu Âu
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/tour-nuoc-ngoai/chau-my" className="tour-dropdown-subitem">
                        Tour Châu Mỹ
                      </NavDropdown.Item>
                    </div>
                  </div>

                  <NavDropdown.Divider className="my-2" />
                  <NavDropdown.Item as={Link} to="/tours" className="text-center fw-bold py-1" style={{ color: '#ea580c' }}>
                    Xem tất cả Tour
                  </NavDropdown.Item>
                </div>
              </NavDropdown>

              {/* Menu Ưu Đãi */}
              <Nav.Link
                as={Link}
                to="/uu-dai"
                className={`header-nav-link ${isPromotionActive ? 'active' : ''}`}
              >
                Ưu Đãi
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/tin-tuc"
                className={`header-nav-link ${isActive('/tin-tuc') ? 'active' : ''}`}
              >
                Tin Tức
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/lien-he"
                className={`header-nav-link ${isActive('/lien-he') ? 'active' : ''}`}
              >
                Liên Hệ
              </Nav.Link>
            </Nav>

            {/* Phía bên phải: Giỏ hàng + Tài khoản */}
            <div className="d-flex align-items-center gap-3 ms-lg-3 mt-3 mt-lg-0">
              {/* Nút Giỏ Hàng có số lượng */}
              <Link
                to="/gio-hang"
                className="header-cart-btn"
                aria-label="Giỏ hàng"
                title="Giỏ hàng của bạn"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" fill="#ea580c" />
                  <circle cx="20" cy="21" r="1" fill="#ea580c" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className="header-cart-badge">{cartCount}</span>
                )}
              </Link>

              {/* User Authentication Actions */}
              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <Link to="/ho-so-ca-nhan" style={{ textDecoration: 'none' }} title="Hồ sơ cá nhân">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #ea580c'
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#ea580c',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '15px',
                        }}
                      >
                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'STAFF' || user.role?.code === 'admin' || user.role?.code?.includes('staff') || (user.roles && (user.roles.includes('ADMIN') || user.roles.includes('STAFF')))) && (
                    <Button
                      as={Link}
                      to="/admin"
                      variant="outline-primary"
                      size="sm"
                      className="header-auth-btn mx-2"
                      style={{ borderColor: '#ea580c', color: '#ea580c' }}
                    >
                      Quản trị
                    </Button>
                  )}
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onOpenLogin}
                    className="header-auth-btn header-login-btn"
                  >
                    Đăng nhập
                  </Button>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
