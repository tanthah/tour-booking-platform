import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  SlidersHorizontal,
  Filter,
  ChevronUp,
  ChevronDown,
  Flame,
  Calendar,
  Briefcase,
} from 'lucide-react';
import TourCard from '../modules/tours/components/TourCard';
import axiosClient from '../config/axiosClient';
import domesticBanner from '../assets/banner_tour_viet_nam.png';
import worldBanner from '../assets/banner_tour_world.png';
import '../assets/styles/tour.css';

/**
 * TourListPage Component - Trang Danh sách Tour (Tour Trong Nước / Nước Ngoài)
 * Tải dữ liệu động từ Backend API (/api/tours/public)
 */
const TourListPage = ({ categoryType }) => {
  const location = useLocation();
  const isAll = categoryType === 'all' || location.pathname === '/tours';
  const isDomestic = !isAll && (categoryType === 'domestic' || location.pathname.includes('trong-nuoc'));
  const categoryEnum = isAll ? undefined : (isDomestic ? 'DOMESTIC' : 'INTERNATIONAL');
  const pageTitle = isAll ? 'Tất Cả Các Tour' : (isDomestic ? 'Tour Trong Nước' : 'Tour Nước Ngoài');

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
        sort: activeSort,
        limit: 12,
      };
      if (categoryEnum) params.category = categoryEnum;

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

  const bannerImage = isDomestic ? domesticBanner : worldBanner;

  return (
    <div className="tour-list-page">
      {/* Breadcrumb phía trên banner */}
      <div className="tour-detail-breadcrumb-wrap">
        <div className="tour-breadcrumb-clean">
          <Link to="/" className="d-inline-flex align-items-center gap-1">
            <Home size={13} />
            <span>Trang Chủ</span>
          </Link>
          <span className="mx-2 text-muted">/</span>
          <span className="text-dark fw-semibold">{pageTitle}</span>
        </div>
      </div>

      {/* 1. Header Banner */}
      <section className="tour-page-banner">
        <img
          src={bannerImage}
          alt={pageTitle}
          className="tour-page-banner-img"
        />
      </section>

      {/* 2. Main Content: Bộ lọc bên trái & Danh sách Tour bên phải */}
      <Container>
        <Row className="gy-4">
          {/* Cột trái: Bộ Lọc (Filter Sidebar) */}
          <Col lg={3} md={4} xs={12}>
            <div className="tour-filter-card">
              <div className="tour-filter-title">
                <span className="tour-filter-title-left">
                  <span className="tour-filter-icon-badge">
                    <Briefcase size={17} />
                  </span>
                  <span>Bộ Lọc</span>
                </span>
                <SlidersHorizontal size={17} />
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
                      className="tour-filter-pax-input"
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
                      className="tour-filter-pax-input"
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
                      className="tour-filter-pax-input"
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

                <Button type="submit" className="tour-filter-btn-apply d-flex justify-content-center align-items-center">
                  <Filter size={15} />
                  <span>Áp Dụng</span>
                </Button>
              </Form>

              {/* Minh họa du lịch nhẹ ở chân bộ lọc */}
              <div className="tour-filter-illustration" aria-hidden="true">
                <svg width="200" height="82" viewBox="0 0 200 82" fill="none">
                  <path d="M12 72 Q55 58 100 72 Q145 84 190 66" fill="#dbeafe" opacity="0.7" />
                  <path d="M44 68 C45 50 47 36 49 26" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M49 26 C38 20 26 24 20 32 C30 29 40 29 49 26 Z" fill="#bfdbfe" />
                  <path d="M49 26 C40 14 28 10 18 14 C28 17 39 20 49 26 Z" fill="#93c5fd" />
                  <path d="M49 26 C56 14 68 12 78 18 C67 19 58 21 49 26 Z" fill="#bfdbfe" />
                  <path d="M49 26 C62 22 72 26 78 35 C68 31 58 28 49 26 Z" fill="#93c5fd" />
                  <path d="M74 56 Q118 46 154 22" stroke="#93c5fd" strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" />
                  <path d="M158 16 L172 12 L166 20 L170 25 L163 22 L159 26 L160 20 Z" fill="#60a5fa" />
                </svg>
              </div>
            </div>
          </Col>

          {/* Cột phải: Danh Sách Tour & Thanh Sắp Xếp */}
          <Col lg={9} md={8} xs={12}>
            {/* Tiêu đề & Giới thiệu danh mục */}
            <div className="tour-list-header">
              <h2 className="tour-list-heading">{pageTitle}</h2>
              <p className="tour-list-subtitle">
                {isAll
                  ? 'Khám phá tất cả các hành trình du lịch trong nước và quốc tế hấp dẫn với dịch vụ tiêu chuẩn tốt nhất từ TourGo.'
                  : isDomestic
                    ? 'Khám phá những danh lam thắng cảnh tuyệt sắc của đất nước cùng các tour hấp dẫn nhất!'
                    : 'Du lịch Châu Á & Thế Giới: Trải nghiệm những nền văn hóa độc đáo, công trình kiến trúc kỳ vĩ và cảnh quan ngoạn mục năm châu.'}
              </p>
            </div>

            {/* Toolbar Sắp Xếp */}
            <div className="tour-sort-bar">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="tour-sort-label">Sắp xếp :</span>
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'price_asc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('price_asc')}
                >
                  <span>Giá tăng dần</span>
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'price_desc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('price_desc')}
                >
                  <span>Giá giảm dần</span>
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'newest' ? 'active' : ''}`}
                  onClick={() => setActiveSort('newest')}
                >
                  <span>Mới nhất</span>
                  <Flame size={14} style={{ color: '#f97316' }} />
                </button>
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'departure_date_asc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('departure_date_asc')}
                >
                  <span>Khởi hành sớm</span>
                  <Calendar size={14} style={{ color: '#0284c7' }} />
                </button>
              </div>

              <div className="tour-total-count">
                Tất cả: <strong>{totalCount} Tour</strong>
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

