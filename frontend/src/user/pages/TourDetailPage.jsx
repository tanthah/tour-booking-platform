import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import '../assets/styles/tour.css';

/**
 * TourDetailPage Component - Trang Chi Tiết Tour
 * Tải dữ liệu động từ Backend API (/api/tours/public/:id)
 * - Gallery ảnh thật
 * - Vùng Rich Text content_html (nhập từ trình soạn thảo của Admin)
 * - Lịch trình itinerary động
 * - Widget đặt tour tính giá theo đơn giá tour thật
 */
const TourDetailPage = () => {
  const { id } = useParams();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState('');
  const [adults, setAdults] = useState(1);
  const [departureCity, setDepartureCity] = useState('');
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  useEffect(() => {
    const fetchTourDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosClient.get(`/tours/public/${id}`);
        if (res?.success && res.data) {
          const tourData = res.data;
          setTour(tourData);
          setActiveImage(tourData.main_image || '');
          setDepartureCity(tourData.departure_location || 'Hà Nội');
        } else {
          setError('Không tìm thấy thông tin tour.');
        }
      } catch (err) {
        setError(err.message || 'Lỗi khi tải thông tin tour.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTourDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#ffffff', minHeight: '60vh' }} className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error || 'Không tìm thấy tour yêu cầu.'}</Alert>
        <Link to="/tour-trong-nuoc">
          <Button variant="warning">Quay lại danh sách tour</Button>
        </Link>
      </Container>
    );
  }

  const galleryImages = [tour.main_image, ...(tour.gallery || [])].filter(Boolean);
  const unitPrice = tour.price || 0;
  const totalPrice = adults * unitPrice;

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 3000);
  };

  const departureDateStr = tour.departure_date
    ? new Date(tour.departure_date).toLocaleDateString('vi-VN')
    : 'Liên hệ';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 1. Header Banner & Breadcrumbs */}
      <section
        className="tour-page-banner"
        style={{ backgroundImage: `url('${activeImage || tour.main_image}')` }}
      >
        <div className="tour-page-banner-overlay" />
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="tour-page-banner-title">{tour.title}</h1>
          <div className="tour-page-breadcrumb">
            <Link to="/">Trang Chủ</Link> »{' '}
            <Link to={tour.category === 'DOMESTIC' ? '/tour-trong-nuoc' : '/tour-nuoc-ngoai'}>
              {tour.category === 'DOMESTIC' ? 'Tour Trong Nước' : 'Tour Nước Ngoài'}
            </Link>{' '}
            » <span>{tour.title}</span>
          </div>
        </Container>
      </section>

      {/* 2. Main Content Grid */}
      <Container>
        <Row className="gy-4">
          {/* CỘT TRÁI (Gallery ảnh, Thông tin Tour, Lịch trình Timeline) */}
          <Col lg={7} xs={12}>
            {/* Gallery ảnh lớn & thumbnails */}
            <div className="mb-4">
              <img
                src={activeImage || tour.main_image}
                alt={tour.title}
                className="tour-detail-main-img mb-3"
              />
              {galleryImages.length > 1 && (
                <Row className="g-2">
                  {galleryImages.map((img, idx) => (
                    <Col key={idx} xs={3}>
                      <img
                        src={img}
                        alt={`Ảnh ${idx + 1}`}
                        className={`tour-detail-thumb-img ${activeImage === img ? 'active' : ''}`}
                        onClick={() => setActiveImage(img)}
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </div>

            {/* Thông Tin Tour - Render HTML từ Rich Text Editor của Admin */}
            <div className="mb-5">
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', marginBottom: '16px' }}>
                Thông Tin Tour
              </h3>
              {tour.content_html ? (
                <div
                  className="tour-rich-content"
                  dangerouslySetInnerHTML={{ __html: tour.content_html }}
                />
              ) : (
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
                  {tour.description || 'Thông tin chi tiết về chuyến tham quan đang được cập nhật.'}
                </p>
              )}
            </div>

            {/* Lịch Trình Tour (Timeline) */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', marginBottom: '20px' }}>
                  Lịch Trình Tour
                </h3>

                <div className="tour-timeline-wrapper">
                  {tour.itinerary.map((item, idx) => (
                    <div className="tour-timeline-day" key={idx}>
                      <div className="tour-timeline-dot" />
                      <span className="tour-timeline-badge">{item.day_title}</span>
                      <div className="tour-timeline-card">
                        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.7, marginBottom: item.image ? '14px' : '0' }}>
                          {item.description}
                        </p>
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.day_title}
                            style={{ width: '100%', borderRadius: '10px', height: '240px', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Col>

          {/* CỘT PHẢI (Widget đặt tour - Chuyến Đi Của Bạn) */}
          <Col lg={5} xs={12}>
            <div className="tour-booking-card">
              <h3 className="tour-booking-title">Chuyến Đi Của Bạn</h3>

              {/* Thông tin vắn tắt tour */}
              <div className="tour-booking-mini-item">
                <img src={tour.main_image} alt={tour.title} className="tour-booking-mini-img" />
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', color: '#1e293b' }}>
                    {tour.title}
                  </h5>
                  <div className="d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                    <span style={{ color: '#f59e0b' }}>★★★★★</span>
                    <span style={{ color: '#64748b' }}>Còn {tour.remaining_slots} chỗ trống</span>
                  </div>
                </div>
              </div>

              {/* Thông tin thông số tour */}
              <div className="mb-3">
                <div className="tour-booking-meta-row">
                  <span>🎫 Mã Tour:</span> <strong className="text-dark">{tour.code}</strong>
                </div>
                <div className="tour-booking-meta-row">
                  <span>📅 Thời Gian:</span> <strong className="text-dark">{tour.duration}</strong>
                </div>
                <div className="tour-booking-meta-row">
                  <span>🚗 Phương Tiện:</span> <strong className="text-dark">{tour.vehicle || 'Ô tô'}</strong>
                </div>
                <div className="tour-booking-meta-row">
                  <span>📅 Ngày Khởi Hành:</span> <strong className="text-dark">{departureDateStr}</strong>
                </div>
                <div className="tour-booking-meta-row">
                  <span>📍 Điểm Đến:</span> <strong className="text-dark">{tour.destination_location}</strong>
                </div>
              </div>

              {/* Chọn điểm khởi hành */}
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Khởi Hành Tại:
                </Form.Label>
                <Form.Select
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value={tour.departure_location}>{tour.departure_location}</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </Form.Select>
              </Form.Group>

              {/* Bộ chọn số lượng hành khách */}
              <div className="mb-3">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Số Lượng Hành Khách
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '13px' }}>
                  <span style={{ minWidth: '70px' }}>Số khách:</span>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="tour-booking-qty-btn"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                    >
                      -
                    </button>
                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 700 }}>{adults}</span>
                    <button
                      className="tour-booking-qty-btn"
                      onClick={() => setAdults(Math.min(tour.remaining_slots || 10, adults + 1))}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ color: '#ea580c', fontWeight: 600 }}>
                    {adults} x {unitPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Tổng cộng & Nút Thêm Vào Giỏ */}
              <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Tổng cộng:</span>
                <span className="tour-booking-total">{totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>

              <Button
                onClick={handleAddToCart}
                className="tour-booking-submit-btn"
                disabled={tour.remaining_slots <= 0}
              >
                {tour.remaining_slots <= 0
                  ? 'Tour Đã Hết Chỗ'
                  : isAddedToCart
                  ? 'Đã Thêm Vào Giỏ Hàng ✓'
                  : 'Thêm Vào Giỏ Hàng'}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TourDetailPage;

