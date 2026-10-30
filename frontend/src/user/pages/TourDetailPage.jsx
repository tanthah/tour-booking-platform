import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TourBookingCard from '../components/TourBookingCard';
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
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [departures, setDepartures] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);

  useEffect(() => {
    const fetchTourDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tourRes, depRes] = await Promise.all([
          axiosClient.get(`/tours/public/${id}`),
          axiosClient.get(`/tours/${id}/departures/public`),
        ]);
        if (tourRes?.success && tourRes.data) {
          setTour(tourRes.data);
          setActiveImage(tourRes.data.main_image || '');
          if (depRes?.success && depRes.data?.length > 0) {
            setDepartures(depRes.data);
            setSelectedDeparture(depRes.data[0]);
          }
        } else {
          setError('Không tìm thấy thông tin tour.');
        }
      } catch (err) {
        setError(err.message || 'Lỗi khi tải thông tin tour.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTourDetail();
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
  const unitPrice = tour.sale_price || tour.original_price || 0;
  const childPrice = unitPrice, babyPrice = unitPrice;
  const totalPrice = (adults * unitPrice) + (children * childPrice) + (babies * babyPrice);
  const totalPassengers = adults + children + babies;
  const availableSlots = selectedDeparture ? selectedDeparture.available_slots : 0;
  const canAddPassenger = totalPassengers < availableSlots;

  // Thêm tour vào giỏ hàng qua API backend
  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để thêm tour vào giỏ hàng.');
      return;
    }
    
    if (!selectedDeparture) {
      alert('Vui lòng chọn đợt khởi hành.');
      return;
    }

    try {
      setAddingToCart(true);
      await axiosClient.post('/cart/items', {
        tour_id: tour._id,
        departure_id: selectedDeparture._id,
        quantity_adult: adults,
        quantity_child: children,
        quantity_baby: babies,
      });
      setIsAddedToCart(true);
      window.dispatchEvent(new Event('cartUpdated'));
      setTimeout(() => setIsAddedToCart(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không thể thêm tour vào giỏ hàng.');
    } finally {
      setAddingToCart(false);
    }
  };

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

            {/* Thông Tin Tour - Render HTML */}
            <div className="mb-4">
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', marginBottom: '14px' }}>
                Thông Tin Tour
              </h3>
              {tour.content_html ? (
                <div className="tour-rich-content" dangerouslySetInnerHTML={{ __html: tour.content_html }} />
              ) : (
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
                  {tour.description || 'Thông tin chi tiết về chuyến tham quan đang được cập nhật.'}
                </p>
              )}
            </div>

            {/* Dịch vụ bao gồm & không bao gồm */}
            {((tour.services_included?.length > 0) || (tour.services_excluded?.length > 0)) && (
              <div className="mb-4">
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>
                  Dịch Vụ Đi Kèm
                </h3>
                <Row className="gy-3">
                  {tour.services_included?.length > 0 && (
                    <Col md={6}>
                      <div className="p-3 rounded border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', fontSize: '13px' }}>
                        <div style={{ fontWeight: 700, color: '#166534', marginBottom: '6px' }}>✓ Dịch vụ bao gồm:</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: '#14532d' }}>
                          {tour.services_included.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </Col>
                  )}
                  {tour.services_excluded?.length > 0 && (
                    <Col md={6}>
                      <div className="p-3 rounded border" style={{ background: '#fef2f2', borderColor: '#fecaca', fontSize: '13px' }}>
                        <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>✕ Dịch vụ không bao gồm:</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: '#7f1d1d' }}>
                          {tour.services_excluded.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </Col>
                  )}
                </Row>
                {tour.special_conditions && (
                  <div className="mt-2 p-2 px-3 rounded border" style={{ background: '#fffbeb', borderColor: '#fde68a', fontSize: '12.5px', color: '#92400e' }}>
                    <strong>Điều kiện đặc biệt:</strong> {tour.special_conditions}
                  </div>
                )}
              </div>
            )}

            {/* Lịch Trình Tour (Timeline) */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', marginBottom: '20px' }}>
                  Lịch Trình Tour
                </h3>

                <div className="tour-timeline-wrapper">
                  {tour.itinerary.map((item, idx) => {
                    const dayImgs = Array.isArray(item.images) && item.images.length > 0
                      ? item.images
                      : (item.image ? [item.image] : []);

                    return (
                      <div className="tour-timeline-day" key={idx}>
                        <div className="tour-timeline-dot" />
                        <span className="tour-timeline-badge">{item.day_title}</span>
                        <div className="tour-timeline-card">
                          <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.7, marginBottom: dayImgs.length > 0 ? '14px' : '0' }}>
                            {item.description}
                          </p>
                          {dayImgs.length === 1 && (
                            <img
                              src={dayImgs[0]}
                              alt={item.day_title}
                              style={{ width: '100%', borderRadius: '10px', height: '240px', objectFit: 'cover' }}
                            />
                          )}
                          {dayImgs.length > 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                              {dayImgs.map((imgUrl, i) => (
                                <img
                                  key={i}
                                  src={imgUrl}
                                  alt={`${item.day_title} ${i + 1}`}
                                  style={{ width: '100%', borderRadius: '8px', height: '130px', objectFit: 'cover' }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Col>

          {/* CỘT PHẢI (Widget đặt tour - Chuyến Đi Của Bạn) */}
          <Col lg={5} xs={12}>
            <TourBookingCard
              tour={tour}
              departures={departures}
              selectedDeparture={selectedDeparture}
              setSelectedDeparture={setSelectedDeparture}
              adults={adults}
              setAdults={setAdults}
              children={children}
              setChildren={setChildren}
              babies={babies}
              setBabies={setBabies}
              unitPrice={unitPrice}
              childPrice={childPrice}
              babyPrice={babyPrice}
              totalPrice={totalPrice}
              canAddPassenger={canAddPassenger}
              handleAddToCart={handleAddToCart}
              addingToCart={addingToCart}
              isAddedToCart={isAddedToCart}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TourDetailPage;

