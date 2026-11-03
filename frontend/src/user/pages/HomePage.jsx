import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import TourCard from '../components/TourCard';
import axiosClient from '../config/axiosClient';
import '../assets/styles/home.css';

/**
 * HomePage Component - Giao diện Trang Chủ nền tảng Đặt Tour Du Lịch
 * Tải dữ liệu thật từ Backend API (/api/tours/public)
 */
const HomePage = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [guests, setGuests] = useState('1');
  const [departureDate, setDepartureDate] = useState('');

  const [flashSaleTours, setFlashSaleTours] = useState([]);
  const [domesticTours, setDomesticTours] = useState([]);
  const [internationalTours, setInternationalTours] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách tour và tin tức nổi bật từ Backend API
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [domesticRes, intlRes, articlesRes] = await Promise.all([
          axiosClient.get('/tours/public', { params: { category: 'DOMESTIC', limit: 8 } }),
          axiosClient.get('/tours/public', { params: { category: 'INTERNATIONAL', limit: 8 } }),
          axiosClient.get('/articles/featured', { params: { limit: 5 } }),
        ]);

        const domesticList = domesticRes?.data?.tours || [];
        const intlList = intlRes?.data?.tours || [];
        const articleList = articlesRes?.data || [];

        setDomesticTours(domesticList);
        setInternationalTours(intlList);
        setFeaturedArticles(articleList);

        // Lấy 3 tour đầu tiên làm danh sách tour nổi bật / giờ chót
        const combined = [...domesticList, ...intlList];
        setFlashSaleTours(combined.slice(0, 3));
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (destination) query.append('search', destination);
    if (departureDate) query.append('departure_date', departureDate);
    navigate(`/tour-trong-nuoc?${query.toString()}`);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* 1. Floating Social Bar */}
      <div className="floating-social-bar d-none d-md-flex">
        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="floating-social-btn" title="Facebook">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="floating-social-btn" title="Instagram">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
        <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="floating-social-btn" title="WhatsApp">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.676.15-.2.301-.776.979-.952 1.18-.176.2-.351.226-.652.075-.3-.15-1.267-.467-2.413-1.488-.893-.795-1.496-1.777-1.671-2.078-.176-.301-.019-.464.132-.614.135-.135.301-.351.451-.526.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.927-2.233-.245-.587-.494-.508-.676-.517-.175-.01-.376-.01-.577-.01-.2 0-.526.075-.802.376-.276.301-1.053 1.029-1.053 2.508 0 1.479 1.078 2.908 1.229 3.109.15.2 2.122 3.24 5.14 4.544.718.31 1.279.496 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.78-.727 2.03-1.43.25-.703.25-1.305.176-1.43-.075-.126-.276-.201-.577-.352z"/></svg>
        </a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="floating-social-btn" title="YouTube">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
      </div>

      {/* 2. Hero Section & Khung Tìm Kiếm */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop')`,
        }}
      >
        <div className="hero-overlay" />
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <div className="text-center">
            <h1 className="hero-title">
              Du lịch Châu Á - Khám phá Mỹ, Úc, Âu
              <br />
              <span style={{ color: '#ea580c' }}>Đi nơi đâu bạn muốn</span>
            </h1>
            <p className="hero-subtitle">
              Trải nghiệm những hành trình mơ ước với dịch vụ hoàn hảo và giá tốt nhất từ TRAVEL.
            </p>

            {/* Widget Tìm Kiếm Tour */}
            <div className="hero-search-box">
              <Form onSubmit={handleSearch}>
                <Row className="gy-3">
                  <Col xs={12}>
                    <Form.Control
                      type="text"
                      placeholder="📍 Bạn muốn đi đâu? (Hà Nội, Hạ Long, Đà Nẵng, Phú Quốc, Bangkok...)"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="hero-search-input"
                    />
                  </Col>

                  <Col md={4} xs={12}>
                    <Form.Select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="hero-search-select"
                    >
                      <option value="1">👤 Số lượng: 1 khách</option>
                      <option value="2">👤 2 khách</option>
                      <option value="4">👤 3 - 5 khách</option>
                      <option value="10">👤 Trên 5 khách</option>
                    </Form.Select>
                  </Col>

                  <Col md={5} xs={12}>
                    <Form.Control
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="hero-search-input"
                    />
                  </Col>

                  <Col md={3} xs={12}>
                    <Button type="submit" className="hero-search-btn w-100">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      Tìm Kiếm
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Section Flash Sale (Banner Màu Cam) */}
      <Container className="my-5">
        <div className="flash-sale-wrapper">
          <Row className="align-items-center gy-4">
            <Col lg={4} md={12} className="text-center text-lg-start">
              <h2 style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.2, marginBottom: '6px' }}>
                ƯU ĐÃI 2024
              </h2>
              <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#fef08a', marginBottom: '14px' }}>
                TOUR GIỜ CHÓT
              </h3>
              <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '20px', maxWidth: '300px' }}>
                Cơ hội đặt tour giá rẻ nhất trong năm. Số lượng có hạn, nhanh tay kẻo lỡ!
              </p>
            </Col>

            <Col lg={8} md={12}>
              {loading ? (
                <div className="text-center py-4 text-white">
                  <Spinner animation="border" size="sm" className="me-2" /> Đang tải danh sách tour...
                </div>
              ) : flashSaleTours.length > 0 ? (
                <Row className="gy-3">
                  {flashSaleTours.map((tour) => (
                    <Col key={tour._id || tour.id} md={4} sm={6} xs={12}>
                      <TourCard tour={tour} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-4 text-white" style={{ opacity: 0.85 }}>
                  Hiện chưa có tour khuyến mãi giờ chót.
                </div>
              )}
            </Col>
          </Row>
        </div>
      </Container>

      {/* 4. Section Tour Trong Nước */}
      <Container className="my-5">
        <h2 className="section-title">Tour Trong Nước</h2>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : domesticTours.length > 0 ? (
          <Row className="gy-4">
            {domesticTours.map((tour) => (
              <Col key={tour._id || tour.id} lg={3} md={6} xs={12}>
                <TourCard tour={tour} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-4 text-muted">Chưa có tour trong nước nào được cập nhật.</div>
        )}
        <div className="text-center mt-4">
          <Link to="/tour-trong-nuoc">
            <Button className="btn-view-all">Xem tất cả</Button>
          </Link>
        </div>
      </Container>

      {/* 5. Section Tour Nước Ngoài */}
      <Container className="my-5">
        <h2 className="section-title">Tour Nước Ngoài</h2>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : internationalTours.length > 0 ? (
          <Row className="gy-4">
            {internationalTours.map((tour) => (
              <Col key={tour._id || tour.id} lg={3} md={6} xs={12}>
                <TourCard tour={tour} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-4 text-muted">Chưa có tour nước ngoài nào được cập nhật.</div>
        )}
        <div className="text-center mt-4">
          <Link to="/tour-nuoc-ngoai">
            <Button className="btn-view-all">Xem tất cả</Button>
          </Link>
        </div>
      </Container>

      {/* 6. Section Tin Tức Nổi Bật */}
      <Container className="my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="section-title m-0">Tin Tức Du Lịch Nổi Bật</h2>
            <p className="text-muted mt-1 mb-0" style={{ fontSize: '14px' }}>
              Cẩm nang, kinh nghiệm du lịch và những điểm đến hot nhất không thể bỏ qua
            </p>
          </div>
          <Link to="/tin-tuc" className="text-decoration-none fw-semibold d-none d-md-inline" style={{ color: '#ea580c' }}>
            Xem tất cả tin tức →
          </Link>
        </div>

        {featuredArticles && featuredArticles.length > 0 ? (
          <Row className="gy-4">
            {/* Cột trái: 2 bài phụ (vị trí 1 & 2) */}
            <Col lg={3} md={6} xs={12} className="d-flex flex-column gap-4">
              {featuredArticles.slice(1, 3).map((art) => (
                <Link
                  key={art._id}
                  to={`/tin-tuc/${art.slug}`}
                  className="news-stacked-card text-decoration-none d-block"
                  style={{
                    backgroundImage: `url('${art.cover_image?.url || 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=600&auto=format&fit=crop'}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="news-stacked-overlay">
                    <span style={{ fontSize: '11px', opacity: 0.9 }}>
                      {new Date(art.published_at || art.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <h5 style={{ fontSize: '14.5px', fontWeight: 700, margin: '4px 0 0', lineHeight: 1.35, color: '#ffffff' }}>
                      {art.title}
                    </h5>
                  </div>
                </Link>
              ))}
            </Col>

            {/* Cột giữa: 1 bài chính nổi bật nhất (vị trí 0) */}
            {featuredArticles[0] && (
              <Col lg={6} md={12} xs={12}>
                <Link
                  to={`/tin-tuc/${featuredArticles[0].slug}`}
                  className="news-featured-card text-decoration-none d-flex flex-column h-100"
                >
                  <div style={{ height: '260px', overflow: 'hidden' }}>
                    <img
                      src={featuredArticles[0].cover_image?.url || 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop'}
                      alt={featuredArticles[0].title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      className="news-featured-img"
                    />
                  </div>
                  <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {featuredArticles[0].category_id?.name && (
                        <span className="badge" style={{ backgroundColor: '#ffedd5', color: '#ea580c', fontSize: '11.5px', fontWeight: 600 }}>
                          {featuredArticles[0].category_id.name}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                        {new Date(featuredArticles[0].published_at || featuredArticles[0].created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#ea580c', margin: '4px 0 10px', lineHeight: 1.4 }}>
                      {featuredArticles[0].title}
                    </h4>
                    <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: 0, flex: 1 }}>
                      {featuredArticles[0].summary}
                    </p>
                  </div>
                </Link>
              </Col>
            )}

            {/* Cột phải: 2 bài phụ (vị trí 3 & 4) */}
            <Col lg={3} md={6} xs={12} className="d-flex flex-column gap-4">
              {featuredArticles.slice(3, 5).map((art) => (
                <Link
                  key={art._id}
                  to={`/tin-tuc/${art.slug}`}
                  className="news-stacked-card text-decoration-none d-block"
                  style={{
                    backgroundImage: `url('${art.cover_image?.url || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop'}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="news-stacked-overlay">
                    <span style={{ fontSize: '11px', opacity: 0.9 }}>
                      {new Date(art.published_at || art.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <h5 style={{ fontSize: '14.5px', fontWeight: 700, margin: '4px 0 0', lineHeight: 1.35, color: '#ffffff' }}>
                      {art.title}
                    </h5>
                  </div>
                </Link>
              ))}
            </Col>
          </Row>
        ) : (
          <div className="text-center py-5 text-muted bg-white rounded-3 border">
            Đang cập nhật các bài viết tin tức mới nhất...
          </div>
        )}

        <div className="text-center mt-4 d-md-none">
          <Link to="/tin-tuc">
            <Button className="btn-view-all">Xem tất cả tin tức</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default HomePage;

