import { Container, Row, Col, Card, Button } from 'react-bootstrap';

/**
 * HomePage Component - Trang chủ chính của nền tảng Đặt Tour Du Lịch
 * Giao diện nằm phía sau background overlay khi kích hoạt Auth Modal
 */
const HomePage = () => {
  // Mock Data: Danh sách các Tour du lịch nổi bật hiển thị ở trang chủ
  const popularTours = [
    {
      id: 1,
      title: 'Đà Lạt - Thành phố ngàn hoa',
      price: '3.500.000',
      duration: '3N2Đ',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Phú Quốc - Đảo Ngọc',
      price: '5.200.000',
      duration: '4N3Đ',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1559628233-100c798642d4?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Hội An - Phố cổ',
      price: '4.100.000',
      duration: '3N2Đ',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop',
    },
    {
      id: 4,
      title: 'Sapa - Ruộng bậc thang',
      price: '4.800.000',
      duration: '4N3Đ',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-5%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        />

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <Row className="align-items-center">
            <Col lg={7}>
              <h1
                style={{
                  fontSize: '52px',
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1.2,
                  marginBottom: '20px',
                }}
              >
                Khám phá Việt Nam
                <br />
                <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  cùng chúng tôi
                </span>
              </h1>
              <p
                style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.7,
                  maxWidth: '550px',
                  marginBottom: '32px',
                }}
              >
                Trải nghiệm những hành trình tuyệt vời đến các địa danh nổi tiếng nhất
                Việt Nam. Đặt tour dễ dàng, giá tốt nhất, dịch vụ chất lượng cao.
              </p>
              <div style={{ display: 'flex', gap: '14px' }}>
                <Button
                  size="lg"
                  style={{
                    background: '#fff',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 700,
                    padding: '14px 32px',
                    fontSize: '16px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  Khám phá ngay
                </Button>
                <Button
                  variant="outline-light"
                  size="lg"
                  style={{
                    borderRadius: '14px',
                    fontWeight: 600,
                    padding: '14px 32px',
                    fontSize: '16px',
                  }}
                >
                  Tìm hiểu thêm
                </Button>
              </div>
            </Col>
            <Col lg={5} className="d-none d-lg-block">
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '120px',
                  filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))',
                }}
              >
                🌏
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '60px 0', background: '#fff' }}>
        <Container>
          <Row className="text-center">
            {[
              { value: '500+', label: 'Tour đa dạng', icon: '🗺' },
              { value: '10K+', label: 'Khách hàng', icon: '👥' },
              { value: '4.8', label: 'Đánh giá trung bình', icon: '⭐' },
              { value: '50+', label: 'Điểm đến', icon: '📍' },
            ].map((stat, i) => (
              <Col key={i} xs={6} md={3} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: '#94a3b8', fontWeight: 500 }}>{stat.label}</div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Popular Tours Section */}
      <section style={{ padding: '80px 0', background: '#f8fafc' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: '#1e293b',
                marginBottom: '12px',
              }}
            >
              Tour nổi bật
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
              Những hành trình được yêu thích nhất bởi hàng ngàn du khách
            </p>
          </div>

          <Row>
            {popularTours.map((tour) => (
              <Col key={tour.id} xs={12} sm={6} lg={3} style={{ marginBottom: '24px' }}>
                <Card
                  style={{
                    border: 'none',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  className="tour-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <Card.Img
                      variant="top"
                      src={tour.image}
                      alt={tour.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#667eea',
                      }}
                    >
                      {tour.duration}
                    </span>
                  </div>
                  <Card.Body style={{ padding: '16px 20px' }}>
                    <Card.Title
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1e293b',
                        marginBottom: '8px',
                      }}
                    >
                      {tour.title}
                    </Card.Title>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: '#667eea',
                        }}
                      >
                        {tour.price}đ
                      </span>
                      <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600 }}>
                        ⭐ {tour.rating}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: '#1e293b',
          color: '#94a3b8',
          padding: '40px 0 20px',
        }}
      >
        <Container>
          <Row>
            <Col md={4} style={{ marginBottom: '20px' }}>
              <h5
                style={{
                  color: '#fff',
                  fontWeight: 700,
                  marginBottom: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ✈ TourBooking
              </h5>
              <p style={{ fontSize: '14px', lineHeight: 1.7 }}>
                Nền tảng đặt tour du lịch trực tuyến hàng đầu Việt Nam.
                Trải nghiệm tuyệt vời, giá cả phải chăng.
              </p>
            </Col>
            <Col md={4} style={{ marginBottom: '20px' }}>
              <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: '12px' }}>Liên kết</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Trang chủ</a>
                <a href="/tours" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tour du lịch</a>
                <a href="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>Giới thiệu</a>
                <a href="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Liên hệ</a>
              </div>
            </Col>
            <Col md={4} style={{ marginBottom: '20px' }}>
              <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: '12px' }}>Liên hệ</h6>
              <div style={{ fontSize: '14px', lineHeight: 2 }}>
                <div>📧 support@tourbooking.vn</div>
                <div>📞 1900 xxxx</div>
                <div>📍 TP. Hồ Chí Minh, Việt Nam</div>
              </div>
            </Col>
          </Row>
          <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
          <div style={{ textAlign: 'center', fontSize: '13px' }}>
            © 2026 TourBooking. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default HomePage;
