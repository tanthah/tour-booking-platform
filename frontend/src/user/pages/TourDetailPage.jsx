import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Compass,
  Car,
  Sparkles,
  Calendar,
  Check,
  X,
  AlertCircle,
  Star,
  MessageSquare,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import TourBookingCard from '../modules/tours/components/TourBookingCard';
import axiosClient from '../config/axiosClient';
import '../assets/styles/tour.css';

/**
 * TourDetailPage Component - Trang Chi Tiết Tour với Tab Navigation
 * - Header & Breadcrumb trên nền trắng tinh giản
 * - Khối ảnh gallery
 * - Thanh Tab điều hướng: Điểm nổi bật, Lịch trình, Bao gồm, Lưu ý, Đánh giá
 * - Khung đặt tour tích hợp lịch khởi hành ở phía trên
 */
const TourDetailPage = () => {
  const { id } = useParams();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [activeTab, setActiveTab] = useState('highlights'); // highlights | itinerary | included | notes | reviews

  // Dữ liệu đặt tour
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [departures, setDepartures] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);

  // Dữ liệu đánh giá từ API
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    stats: { averageRating: 5.0, totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
  });

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

          // Tải dữ liệu đánh giá nếu có
          try {
            const revRes = await axiosClient.get(`/reviews/tour/${tourRes.data._id}`);
            if (revRes?.success && revRes.data) {
              setReviewsData(revRes.data);
            }
          } catch {
            // Dữ liệu đánh giá chưa có sẵn thì bỏ qua
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
  const childPrice = tour.price_child ?? Math.round(unitPrice * 0.7);
  const babyPrice = tour.price_baby ?? 0;
  const totalPrice = (adults * unitPrice) + (children * childPrice) + (babies * babyPrice);
  const totalPassengers = adults + children + babies;
  const availableSlots = selectedDeparture ? (selectedDeparture.available_slots ?? (selectedDeparture.total_slots - selectedDeparture.booked_slots - selectedDeparture.reserved_slots)) : 0;
  const canAddPassenger = totalPassengers < availableSlots;

  // Thêm tour vào giỏ hàng
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

  // Danh sách các điểm nhấn mặc định nếu tour chưa có highlights từ admin
  const defaultHighlights = [
    `Khám phá trọn vẹn điểm đến tuyệt đẹp tại ${tour.destination_location}`,
    `Thời gian trải nghiệm ${tour.duration} với lộ trình tối ưu và thư giãn`,
    `Phương tiện di chuyển tiện nghi (${selectedDeparture?.vehicle || 'Xe du lịch chất lượng cao'})`,
    'Hướng dẫn viên chuyên nghiệp, nhiệt tình đồng hành suốt chuyến đi',
    'Thưởng thức các món ăn đặc sản vùng miền hấp dẫn',
  ];

  const highlightsList = (tour.highlights && tour.highlights.length > 0)
    ? tour.highlights
    : defaultHighlights;

  // Danh sách tabs cấu hình
  const tabList = [
    { id: 'highlights', label: 'Điểm nổi bật' },
    { id: 'itinerary', label: 'Lịch trình' },
    { id: 'included', label: 'Bao gồm' },
    { id: 'notes', label: 'Lưu ý' },
    { id: 'reviews', label: 'Đánh giá' },
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ============================================================
          1. HEADER BREADCRUMB & TÊN TOUR TRÊN NỀN TRẮNG
          ============================================================ */}
      <section className="tour-header-white py-4 mb-4">
        <Container>
          {/* Breadcrumb bình thường, nền trắng */}
          <div className="tour-breadcrumb-clean mb-2">
            <Link to="/">Trang Chủ</Link>
            <span className="mx-2 text-muted">»</span>
            <Link to={tour.category === 'DOMESTIC' ? '/tour-trong-nuoc' : '/tour-nuoc-ngoai'}>
              {tour.category === 'DOMESTIC' ? 'Tour Trong Nước' : 'Tour Nước Ngoài'}
            </Link>
            <span className="mx-2 text-muted">»</span>
            <span className="text-dark fw-semibold">{tour.title}</span>
          </div>

          {/* Tên tour trên nền trắng */}
          <h1 className="tour-detail-title-clean">{tour.title}</h1>

          {/* Thông tin thông số nhanh */}
          <div className="d-flex flex-wrap align-items-center gap-3 text-muted" style={{ fontSize: '13.5px' }}>
            {tour.code && (
              <span className="badge bg-light text-secondary border px-2 py-1">
                Mã tour: <strong className="text-dark">{tour.code}</strong>
              </span>
            )}
            {tour.duration && (
              <span className="d-inline-flex align-items-center gap-1">
                <Clock size={15} className="text-warning" />
                Thời gian: <strong className="text-dark">{tour.duration}</strong>
              </span>
            )}
            {tour.destination_location && (
              <span className="d-inline-flex align-items-center gap-1">
                <MapPin size={15} className="text-danger" />
                Điểm đến: <strong className="text-dark">{tour.destination_location}</strong>
              </span>
            )}
            {selectedDeparture?.vehicle && (
              <span className="d-inline-flex align-items-center gap-1">
                <Car size={15} className="text-primary" />
                Phương tiện: <strong className="text-dark">{selectedDeparture.vehicle}</strong>
              </span>
            )}
            {selectedDeparture?.departure_location && (
              <span className="d-inline-flex align-items-center gap-1">
                <Compass size={15} className="text-success" />
                Khởi hành từ: <strong className="text-dark">{selectedDeparture.departure_location}</strong>
              </span>
            )}
          </div>
        </Container>
      </section>

      {/* ============================================================
          2. MAIN CONTENT GRID (2 CỘT)
          ============================================================ */}
      <Container>
        <Row className="gy-4">
          {/* CỘT TRÁI (Gallery ảnh, Thanh Tab, Nội dung Tab) - Chiếm 8/12 để rộng rãi hơn */}
          <Col lg={8} xs={12}>
            {/* Gallery ảnh lớn & ảnh nhỏ */}
            <div className="bg-white p-3 rounded-4 shadow-sm mb-4">
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

            {/* ============================================================
                3. TAB BAR NAVIGATION (Điểm nổi bật, Lịch trình, Bao gồm, Lưu ý, Đánh giá)
                ============================================================ */}
            <div className="tour-tabs-container">
              {tabList.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tour-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ============================================================
                4. TAB CONTENT
                ============================================================ */}

            {/* TAB 1: ĐIỂM NỔI BẬT (Nội dung điểm nhấn + Mô tả tổng quan tour - Chữ bình thường) */}
            {activeTab === 'highlights' && (
              <div className="tour-tab-content-card">
                {/* Điểm nổi bật của chuyến đi */}
                <div className="mb-4">
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
                    Điểm nổi bật của chuyến đi
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '22px', color: '#334155', fontSize: '14.5px', lineHeight: 1.8 }}>
                    {highlightsList.map((hl, index) => (
                      <li key={index} style={{ marginBottom: '6px' }}>{hl}</li>
                    ))}
                  </ul>
                </div>

                <hr style={{ borderColor: '#f1f5f9', margin: '24px 0' }} />

                {/* Mô tả tổng quan tour */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
                    Mô tả tổng quan tour
                  </h3>
                  {tour.content_html ? (
                    <div className="tour-rich-content" dangerouslySetInnerHTML={{ __html: tour.content_html }} />
                  ) : (
                    <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.8, margin: 0 }}>
                      {tour.description || 'Thông tin chi tiết về chuyến tham quan đang được cập nhật.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LỊCH TRÌNH */}
            {activeTab === 'itinerary' && (
              <div className="tour-tab-content-card">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Lịch trình chi tiết
                </h3>
                <p className="text-muted" style={{ fontSize: '13.5px', marginBottom: '20px' }}>
                  Lộ trình chuyến tham quan được thiết kế khoa học, mang lại trải nghiệm trọn vẹn nhất.
                </p>

                {tour.itinerary && tour.itinerary.length > 0 ? (
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
                            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.75, marginBottom: dayImgs.length > 0 ? '14px' : '0' }}>
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
                ) : (
                  <div className="text-center py-5 text-muted">
                    <Calendar size={36} className="text-warning mb-2" />
                    <p style={{ fontSize: '14px' }}>Lịch trình chi tiết đang được cập nhật. Quý khách vui lòng liên hệ tư vấn viên để nhận lộ trình cụ thể.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BAO GỒM & KHÔNG BAO GỒM (Chữ bình thường) */}
            {activeTab === 'included' && (
              <div className="tour-tab-content-card">
                {/* Dịch vụ bao gồm */}
                <div className="mb-4">
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                    Dịch vụ bao gồm
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '22px', color: '#334155', fontSize: '14.5px', lineHeight: 1.8 }}>
                    {tour.services_included?.length > 0 ? (
                      tour.services_included.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)
                    ) : (
                      <>
                        <li style={{ marginBottom: '6px' }}>Xe du lịch đưa đón theo chương trình</li>
                        <li style={{ marginBottom: '6px' }}>Vé tham quan các điểm có trong lộ trình</li>
                        <li style={{ marginBottom: '6px' }}>Hướng dẫn viên nhiệt tình, tận tâm suốt tuyến</li>
                        <li style={{ marginBottom: '6px' }}>Bảo hiểm du lịch theo quy định</li>
                        <li style={{ marginBottom: '6px' }}>Nước suối và khăn lạnh trên xe</li>
                      </>
                    )}
                  </ul>
                </div>

                <hr style={{ borderColor: '#f1f5f9', margin: '24px 0' }} />

                {/* Dịch vụ không bao gồm */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                    Dịch vụ không bao gồm
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '22px', color: '#334155', fontSize: '14.5px', lineHeight: 1.8 }}>
                    {tour.services_excluded?.length > 0 ? (
                      tour.services_excluded.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)
                    ) : (
                      <>
                        <li style={{ marginBottom: '6px' }}>Thuế VAT (nếu quý khách có nhu cầu xuất hóa đơn)</li>
                        <li style={{ marginBottom: '6px' }}>Chi phí ăn uống và phát sinh cá nhân ngoài chương trình</li>
                        <li style={{ marginBottom: '6px' }}>Tiền tip (bồi dưỡng) cho lái xe và hướng dẫn viên</li>
                        <li style={{ marginBottom: '6px' }}>Phụ thu phòng đơn (nếu có yêu cầu)</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: LƯU Ý (Chữ bình thường) */}
            {activeTab === 'notes' && (
              <div className="tour-tab-content-card">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
                  Lưu ý cho khách hàng
                </h3>

                {/* Nội dung lưu ý từ admin nếu có */}
                {tour.notes ? (
                  <div className="tour-rich-content mb-4" dangerouslySetInnerHTML={{ __html: tour.notes }} />
                ) : null}

                {/* Điều kiện đặc biệt */}
                {tour.special_conditions ? (
                  <div className="mb-4">
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                      Điều kiện đặc biệt
                    </h4>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14.5px', lineHeight: 1.8 }}>
                      {tour.special_conditions}
                    </p>
                  </div>
                ) : null}

                {/* Các quy định chung hiển thị chữ bình thường */}
                <ul style={{ margin: 0, paddingLeft: '22px', color: '#334155', fontSize: '14.5px', lineHeight: 1.8 }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Giấy tờ tùy thân:</strong> Quý khách vui lòng mang theo Căn cước công dân hoặc Hộ chiếu gốc còn hạn trên 6 tháng. Trẻ em mang theo bản sao Giấy khai sinh.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Thời gian tập trung:</strong> Quý khách có mặt tại điểm đón trước giờ khởi hành tối thiểu 20-30 phút để chuẩn bị thủ tục xuất phát.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Chính sách hoàn hủy:</strong> Áp dụng theo quy chế đặt và hủy tour của công ty. Vui lòng liên hệ trung tâm hỗ trợ để nắm chi tiết từng mốc thời gian.
                  </li>
                </ul>
              </div>
            )}

            {/* TAB 5: ĐÁNH GIÁ (Dữ liệu sẽ cập nhật sau) */}
            {activeTab === 'reviews' && (
              <div className="tour-tab-content-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Đánh giá của khách hàng
                  </h3>
                  <span className="badge bg-light text-secondary border px-3 py-2" style={{ fontSize: '12px' }}>
                    Hệ thống phản hồi thực tế
                  </span>
                </div>

                {/* Thống kê đánh giá tổng quan */}
                <div className="tour-review-summary-card">
                  <div className="tour-review-rating-huge">
                    {reviewsData.stats?.averageRating || 5.0}
                  </div>
                  <div className="d-flex justify-content-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={20} className="text-warning fill-warning" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    ))}
                  </div>
                  <div className="text-muted" style={{ fontSize: '13px' }}>
                    Dựa trên {reviewsData.stats?.totalReviews || 0} lượt trải nghiệm dịch vụ
                  </div>
                </div>

                {/* Thông báo cập nhật dữ liệu đánh giá */}
                <div className="alert alert-info d-flex align-items-center gap-2 mb-4" style={{ fontSize: '13.5px' }}>
                  <MessageSquare size={18} className="flex-shrink-0" />
                  <div>
                    <strong>Thông báo:</strong> Dữ liệu đánh giá từ khách hàng đã tham gia tour đang được hệ thống đồng bộ và cập nhật.
                  </div>
                </div>

                {/* Danh sách review nếu có */}
                {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviewsData.reviews.map((rev) => (
                      <div key={rev._id} className="p-3 border rounded-3 mb-3 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-dark">{rev.user_id?.full_name || 'Khách hàng'}</strong>
                          <span className="text-muted" style={{ fontSize: '12px' }}>
                            {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="d-flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              style={{
                                fill: star <= rev.rating ? '#f59e0b' : 'none',
                                color: star <= rev.rating ? '#f59e0b' : '#d1d5db',
                              }}
                            />
                          ))}
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted border rounded-3 bg-light">
                    <p style={{ fontSize: '13.5px', margin: 0 }}>
                      Chưa có đánh giá nào cho chuyến đi này. Chúc bạn có một hành trình đáng nhớ!
                    </p>
                  </div>
                )}
              </div>
            )}
          </Col>

          {/* CỘT PHẢI (Khung đặt tour làm gọn gàng hơn - Chiếm 4/12) */}
          <Col lg={4} xs={12}>
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
