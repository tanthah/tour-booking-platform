import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import TourCard from '../components/TourCard';
import CouponSection from '../components/coupon/CouponSection';
import axiosClient from '../config/axiosClient';
import '../assets/styles/tour.css';

/**
 * PromotionPage Component - Trang danh sách các Tour Ưu Đãi & Khuyến Mãi
 * Tải dữ liệu từ Backend API (/api/tours/public) và lọc các tour giảm giá, flash sale
 */
const PromotionPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeSort, setActiveSort] = useState('discount_desc');

  // Lấy dữ liệu tour từ API backend giữ nguyên
  const fetchPromotionTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API danh sách public của Backend
      const res = await axiosClient.get('/tours/public', {
        params: {
          limit: 36,
          sort: 'newest',
        },
      });

      const allTours = res?.data?.tours || [];
      setTours(allTours);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tour ưu đãi:', err);
      setError('Không thể tải danh sách ưu đãi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotionTours();
  }, [fetchPromotionTours]);

  // Lọc và sắp xếp các tour ưu đãi
  const filteredTours = tours
    .filter((tour) => {
      // Ưu tiên tour có giảm giá hoặc flash sale
      const hasDiscount = (tour.discount_percent && tour.discount_percent > 0) || tour.is_flash_sale;
      // Nếu tour không có discount_percent, vẫn hiển thị nếu danh sách ít để khách hàng có tour xem
      const matchesDiscount = hasDiscount || tours.length <= 6;

      if (!matchesDiscount) return false;

      if (activeCategory === 'DOMESTIC') {
        return tour.category === 'DOMESTIC';
      }
      if (activeCategory === 'INTERNATIONAL') {
        return tour.category === 'INTERNATIONAL';
      }
      return true;
    })
    .sort((a, b) => {
      const discountA = a.discount_percent || 0;
      const discountB = b.discount_percent || 0;
      const priceA = a.sale_price || a.price || 0;
      const priceB = b.sale_price || b.price || 0;

      if (activeSort === 'discount_desc') {
        return discountB - discountA;
      }
      if (activeSort === 'price_asc') {
        return priceA - priceB;
      }
      if (activeSort === 'price_desc') {
        return priceB - priceA;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '70px' }}>
      {/* 1. Header Banner */}
      <section
        className="tour-page-banner"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop')`,
        }}
      >
        <div className="tour-page-banner-overlay" />
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <div className="d-flex justify-content-center mb-2">
            <Badge bg="danger" className="px-3 py-2 text-uppercase fs-6 shadow-sm">
              🔥 Khuyến Mãi Cực Sốc
            </Badge>
          </div>
          <h1 className="tour-page-banner-title">Chương Trình Ưu Đãi Đặc Biệt</h1>
          <div className="tour-page-breadcrumb">
            <Link to="/">Trang Chủ</Link> » <span>Ưu Đãi</span>
          </div>
        </Container>
      </section>

      {/* 2. Main Content */}
      <Container className="mt-5">
        {/* Phần 1: Kho Mã Giảm Giá Đặc Quyền (Coupon) */}
        <CouponSection />

        {/* Phần 2: Danh Sách Tour Khuyến Mãi */}
        <div id="promotion-tours-section" className="pt-2">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-4"></span>
            <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
              Tour Đang Giảm Giá Sốc
            </h2>
          </div>

          {/* Bộ lọc Danh mục & Sắp xếp */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
            {/* Tabs danh mục */}
            <div className="d-flex flex-wrap gap-2">
              <Button
                variant={activeCategory === 'ALL' ? 'warning' : 'outline-secondary'}
                size="sm"
                className="fw-bold px-3 py-2"
                style={activeCategory === 'ALL' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
                onClick={() => setActiveCategory('ALL')}
              >
                Tất Cả Ưu Đãi ({tours.length})
              </Button>
              <Button
                variant={activeCategory === 'DOMESTIC' ? 'warning' : 'outline-secondary'}
                size="sm"
                className="fw-bold px-3 py-2"
                style={activeCategory === 'DOMESTIC' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
                onClick={() => setActiveCategory('DOMESTIC')}
              >
                Tour Trong Nước
              </Button>
              <Button
                variant={activeCategory === 'INTERNATIONAL' ? 'warning' : 'outline-secondary'}
                size="sm"
                className="fw-bold px-3 py-2"
                style={activeCategory === 'INTERNATIONAL' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
                onClick={() => setActiveCategory('INTERNATIONAL')}
              >
                Tour Nước Ngoài
              </Button>
            </div>

            {/* Sắp xếp */}
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                Sắp xếp theo:
              </span>
              <div className="d-flex gap-1 flex-wrap">
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'discount_desc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('discount_desc')}
                >
                  Giảm nhiều nhất 💥
                </button>
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'price_asc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('price_asc')}
                >
                  Giá tăng dần ↗
                </button>
                <button
                  type="button"
                  className={`tour-sort-btn ${activeSort === 'price_desc' ? 'active' : ''}`}
                  onClick={() => setActiveSort('price_desc')}
                >
                  Giá giảm dần ↘
                </button>
              </div>
            </div>
          </div>

          {/* Thông báo lỗi nếu có */}
          {error && (
            <div className="alert alert-danger text-center my-4" role="alert">
              {error}
            </div>
          )}

          {/* Danh sách Tour Ưu Đãi */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="warning" />
              <p className="mt-3 text-muted">Đang tìm các tour ưu đãi tốt nhất cho bạn...</p>
            </div>
          ) : filteredTours.length > 0 ? (
            <Row className="gy-4">
              {filteredTours.map((tour) => (
                <Col key={tour._id || tour.id} lg={3} md={6} xs={12}>
                  <TourCard
                    tour={{
                      ...tour,
                      price: tour.sale_price || tour.price,
                      original_price: tour.original_price,
                      discount: tour.discount_percent ? `-${tour.discount_percent}%` : '',
                    }}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5 my-4 bg-light rounded-3 p-4">
              <div className="fs-1 mb-2">🎁</div>
              <h4 className="fw-bold text-dark">Hiện chưa có tour ưu đãi phù hợp</h4>
              <p className="text-muted">Vui lòng chọn danh mục khác hoặc quay lại sau để cập nhật những deal hot nhất.</p>
              <Link to="/tours">
                <Button style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} className="fw-bold px-4 py-2 mt-2">
                  Xem tất cả các tour du lịch
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default PromotionPage;
