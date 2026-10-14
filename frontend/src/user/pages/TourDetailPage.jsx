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
  const [departureCity, setDepartureCity] = useState('');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const [departures, setDepartures] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);

  useEffect(() => {
    const fetchTourDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Chạy song song 2 request: lấy chi tiết tour và danh sách đợt khởi hành đang mở
        const [tourRes, depRes] = await Promise.all([
          axiosClient.get(`/tours/public/${id}`),
          axiosClient.get(`/tours/${id}/departures/public`)
        ]);

        if (tourRes?.success && tourRes.data) {
          const tourData = tourRes.data;
          setTour(tourData);
          setActiveImage(tourData.main_image || '');
          
          if (depRes?.success && depRes.data) {
            setDepartures(depRes.data);
            if (depRes.data.length > 0) {
              setSelectedDeparture(depRes.data[0]); // Chọn mặc định đợt đầu tiên
            }
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
  const unitPrice = tour.sale_price || tour.original_price || 0;
  const childPrice = unitPrice;
  const babyPrice = unitPrice;
  const totalPrice = (adults * unitPrice) + (children * childPrice) + (babies * babyPrice);
  const totalPassengers = adults + children + babies;
  
  // Sức chứa dựa trên đợt khởi hành đã chọn
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

