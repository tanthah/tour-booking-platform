import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import TourCard from '../components/TourCard';
import axiosClient from '../config/axiosClient';
import '../assets/styles/tour.css';

/**
 * TourListPage Component - Trang Danh sách Tour (Tour Trong Nước / Nước Ngoài)
 * Tải dữ liệu động từ Backend API (/api/tours/public)
 */
const TourListPage = ({ categoryType }) => {
  const location = useLocation();
  const isDomestic = categoryType === 'domestic' || location.pathname.includes('trong-nuoc');
  const categoryEnum = isDomestic ? 'DOMESTIC' : 'INTERNATIONAL';
  const pageTitle = isDomestic ? 'Tour Trong Nước' : 'Tour Nước Ngoài';

  // Trạng thái bộ lọc và sắp xếp
  const [departureFrom, setDepartureFrom] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [priceRange, setPriceRange] = useState('');
  const [activeSort, setActiveSort] = useState('newest');

  // Trạng thái dữ liệu danh sách tour
  const [tours, setTours] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hàm gọi API lấy danh sách tour
  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: categoryEnum,
        sort: activeSort,
        limit: 12,
      };

      if (destination) params.search = destination;
      if (departureFrom) params.departure_location = departureFrom;
      if (departureDate) params.departure_date = departureDate;

      if (priceRange === 'under-5') {
        params.max_price = 5000000;
      } else if (priceRange === '5-10') {
        params.min_price = 5000000;
        params.max_price = 10000000;
      } else if (priceRange === 'above-10') {
        params.min_price = 10000000;
      }

      const res = await axiosClient.get('/tours/public', { params });
      if (res?.success) {
        setTours(res.data.tours || []);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách tour:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryEnum, activeSort, destination, departureFrom, departureDate, priceRange]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchTours();
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '70px' }}>
      {/* 1. Header Banner & Breadcrumb */}
      <section
        className="tour-page-banner"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&auto=format&fit=crop')`,
        }}
      >
        <div className="tour-page-banner-overlay" />
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="tour-page-banner-title">{pageTitle}</h1>
          <div className="tour-page-breadcrumb">
            <Link to="/">Trang Chủ</Link> » <span>{pageTitle}</span>
          </div>
        </Container>
      </section>

      {/* 2. Main Content: Bộ lọc bên trái & Danh sách Tour bên phải */}
      <Container>
        <Row className="gy-4">
          {/* Cột trái: Bộ Lọc (Filter Sidebar) */}
          <Col lg={3} md={4} xs={12}>
            <div className="tour-filter-card">
              <div className="tour-filter-title">
                <span>Bộ Lọc</span>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                </svg>
              </div>

              <Form onSubmit={handleApplyFilter}>
                {/* Điểm đi */}
                <Form.Group className="mb-3">
                  <Form.Label className="tour-filter-label">Điểm đi</Form.Label>
                  <Form.Select
                    value={departureFrom}
                    onChange={(e) => setDepartureFrom(e.target.value)}
                    className="tour-filter-select"
                  >
                    <option value="">Tất cả điểm đi</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP.HCM">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </Form.Select>
                </Form.Group>

                {/* Điểm đến / Tìm kiếm */}
                <Form.Group className="mb-3">
                  <Form.Label className="tour-filter-label">Điểm đến</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập địa danh hoặc tên tour..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="tour-filter-input"
                  />
                </Form.Group>

                {/* Ngày khởi hành */}
                <Form.Group className="mb-3">
                  <Form.Label className="tour-filter-label">Ngày khởi hành</Form.Label>
                  <Form.Control
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="tour-filter-input"
                  />
                </Form.Group>

                {/* Số lượng hành khách */}
                <div className="mb-3">
                  <div className="tour-filter-label mb-2">Số Lượng Hành Khách</div>
                  <div className="tour-filter-passenger-row">
                    <span>Người lớn:</span>
                    <Form.Control
                      type="number"
                      min="1"
                      max="20"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      style={{ width: '70px', height: '34px', fontSize: '13px' }}
                    />
                  </div>
                  <div className="tour-filter-passenger-row">
                    <span>Trẻ em:</span>
                    <Form.Control
                      type="number"
                      min="0"
                      max="10"
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      style={{ width: '70px', height: '34px', fontSize: '13px' }}
                    />
                  </div>
                  <div className="tour-filter-passenger-row">
                    <span>Em bé:</span>
                    <Form.Control
                      type="number"
                      min="0"
                      max="10"
                      value={babies}
                      onChange={(e) => setBabies(Number(e.target.value))}
                      style={{ width: '70px', height: '34px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Mức giá */}
                <Form.Group className="mb-3">
                  <Form.Label className="tour-filter-label">Mức giá</Form.Label>
                  <Form.Select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="tour-filter-select"
                  >
                    <option value="">-- Chọn khoảng giá --</option>
                    <option value="under-5">Dưới 5.000.000đ</option>
                    <option value="5-10">Từ 5.000.000đ - 10.000.000đ</option>
                    <option value="above-10">Trên 10.000.000đ</option>
                  </Form.Select>
                </Form.Group>

                <Button type="submit" className="tour-filter-btn-apply w-100 d-flex justify-content-center align-items-center">
                  Áp Dụng
                </Button>
              </Form>
            </div>
          </Col>

          {/* Cột phải: Danh Sách Tour & Thanh Sắp Xếp */}
          <Col lg={9} md={8} xs={12}>
            {/* Tiêu đề & Giới thiệu danh mục */}
            <div className="mb-4">
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ea580c', marginBottom: '8px' }}>
                {pageTitle}
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {isDomestic
                  ? 'Khám phá những danh lam thắng cảnh tuyệt sắc của dải đất hình chữ S từ Bắc chí Nam cùng dịch vụ tour trọn gói chu đáo nhất.'
                  : 'Du lịch Châu Á & Thế Giới: Trải nghiệm những nền văn hóa độc đáo, công trình kiến trúc kỳ vĩ và cảnh quan ngoạn mục năm châu.'}
              </p>
            </div>

            {/* Toolbar Sắp Xếp */}
            <div className="tour-sort-bar">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Sắp xếp :
                </span>
                <button
                  className={`tour-sort-btn ${activeSort === 'price_asc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('price_asc')}
                >
                  Giá tăng dần ↗
                </button>
                <button
                  className={`tour-sort-btn ${activeSort === 'price_desc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('price_desc')}
                >
                  Giá giảm dần ↘
                </button>
                <button
                  className={`tour-sort-btn ${activeSort === 'newest' ? 'active' : ''}`}
                  onClick={() => setActiveSort('newest')}
                >
                  Mới nhất 🔥
                </button>
                <button
                  className={`tour-sort-btn ${activeSort === 'departure_date_asc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('departure_date_asc')}
                >
                  Khởi hành sớm 📅
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Tất cả: <strong className="text-dark">{totalCount} Tour</strong>
              </div>
            </div>

            {/* Grid Thẻ Tour */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="warning" />
              </div>
            ) : tours.length > 0 ? (
              <Row className="gy-4">
                {tours.map((tour) => (
                  <Col key={tour._id || tour.id} lg={4} sm={6} xs={12}>
                    <TourCard tour={tour} />
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-5 text-muted">
                Không tìm thấy tour phù hợp với tiêu chí lọc.
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TourListPage;

