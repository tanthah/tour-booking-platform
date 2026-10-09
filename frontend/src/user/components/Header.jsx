import { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';

/**
 * Header Component - Thanh Điều Hướng (Navbar) hiển thị đính kèm Nút Đăng nhập/Đăng ký
 * Sau khi User đăng nhập thành công: Hiển thị Avatar, Tên User và nút Đăng xuất
 */
const Header = ({ user, onOpenLogin, onOpenRegister, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Navbar
      expand="lg"
      fixed="top"
      style={{
        background: scrolled
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        boxShadow: scrolled
          ? '0 2px 20px rgba(0, 0, 0, 0.08)'
          : 'none',
        transition: 'all 0.3s ease',
        padding: '12px 0',
      }}
    >
      <Container>
        <Navbar.Brand
          href="/"
          style={{
            fontWeight: 800,
            fontSize: '22px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          ✈ TourBooking
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link href="/" style={{ fontWeight: 500, color: '#475569' }}>
              Trang chủ
            </Nav.Link>
            <Nav.Link href="/tours" style={{ fontWeight: 500, color: '#475569' }}>
              Tour du lịch
            </Nav.Link>
            <Nav.Link href="/about" style={{ fontWeight: 500, color: '#475569' }}>
              Giới thiệu
            </Nav.Link>
            <Nav.Link href="/contact" style={{ fontWeight: 500, color: '#475569' }}>
              Liên hệ
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto" style={{ gap: '10px', alignItems: 'center' }}>
            {user ? (
              <>
                <span
                  style={{
                    fontWeight: 600,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    {user.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                  {user.full_name}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={onLogout}
                  style={{
                    borderRadius: '10px',
                    fontWeight: 600,
                    padding: '6px 16px',
                  }}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={onOpenLogin}
                  style={{
                    borderRadius: '10px',
                    fontWeight: 600,
                    padding: '8px 20px',
                    borderColor: '#667eea',
                    color: '#667eea',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={onOpenRegister}
                  style={{
                    borderRadius: '10px',
                    fontWeight: 600,
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
