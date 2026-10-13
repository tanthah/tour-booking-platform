import { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import '../assets/styles/footer.css';

/**
 * Footer Component - Chân trang theo thương hiệu Tourn Go
 * Bao gồm:
 * 1. Banner Đăng ký nhận tin tức (Newsletter) với nền Cam Hoàng Hôn và nút gửi
 * 2. Hàng điều hướng menu và icon mạng xã hội (Facebook, Twitter/X, Instagram, Youtube)
 * 3. Hàng chân trang: Bản quyền, Logo thương hiệu ở giữa, Điều khoản & Chính sách
 */
const Footer = ({ settings }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="footer-wrapper">
      <Container>
        {/* Banner Đăng ký nhận tin (Purple Newsletter Banner) */}
        <div className="footer-newsletter-card">
          <Row className="align-items-center gy-3">
            <Col lg={6} md={12}>
              <h3 className="footer-newsletter-title">
                Đăng Ký Ngay Để Không Bỏ Lỡ Các
                <br />
                Chương Trình Của Chúng Tôi
              </h3>
            </Col>

            <Col lg={6} md={12}>
              <Form onSubmit={handleSubscribe}>
                <div className="footer-newsletter-form-wrapper">
                  <Form.Control
                    type="email"
                    placeholder="Nhập email của bạn..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="footer-newsletter-input"
                    required
                  />
                  <Button type="submit" className="footer-newsletter-btn">
                    {subscribed ? 'Đã Đăng Ký ✓' : 'Đăng Ký Ngay'}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </div>

        {/* Hàng Menu & Mạng xã hội */}
        <Row className="align-items-center justify-content-between gy-3">
          <Col md={7} xs={12}>
            <div className="d-flex flex-wrap gap-4 align-items-center">
              <Link to="/" className="footer-nav-link">Trang Chủ</Link>
              <Link to="/tour-trong-nuoc" className="footer-nav-link">Tour Trong Nước</Link>
              <Link to="/tour-nuoc-ngoai" className="footer-nav-link">Tour Nước Ngoài</Link>
              <Link to="/tin-tuc" className="footer-nav-link">Tin Tức</Link>
              <Link to="/lien-he" className="footer-nav-link">Liên Hệ</Link>
            </div>
          </Col>

          <Col md={5} xs={12} className="text-md-end">
            <div className="d-flex gap-3 justify-content-md-end align-items-center">
              {/* Facebook Icon */}
              <a href={settings?.facebook_url || "https://facebook.com"} target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Facebook">
                <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.326V1.326C24 .597 23.403 0 22.675 0z" />
                </svg>
              </a>

              {/* Twitter / X Icon */}
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Twitter">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram Icon */}
              <a href={settings?.instagram_url || "https://instagram.com"} target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Instagram">
                <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube Icon */}
              <a href={settings?.youtube_url || "https://youtube.com"} target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="YouTube">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </Col>
        </Row>

        {/* Đường kẻ phân cách */}
        <hr className="footer-divider" />

        {/* Hàng bản quyền & Logo chân trang */}
        <Row className="align-items-center gy-3 text-center text-md-start">
          <Col md={4} xs={12}>
            <p className="footer-bottom-text">
              © 2026 Tourn Go. All rights reserved.
            </p>
          </Col>

          <Col md={4} xs={12} className="text-center">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo height={60} logoUrl={settings?.logo_url} />
            </Link>
          </Col>

          <Col md={4} xs={12} className="text-md-end">
            <div className="d-flex gap-3 justify-content-center justify-content-md-end">
              <Link to="/dieu-khoan" className="footer-sub-link">
                Điều khoản dịch vụ
              </Link>
              <Link to="/chinh-sach-bao-mat" className="footer-sub-link">
                Chính sách bảo mật
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
