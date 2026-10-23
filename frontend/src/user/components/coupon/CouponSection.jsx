import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import CouponCard from './CouponCard';
import { getPublicCoupons } from '../../modules/coupon/couponService';

/**
 * CouponSection Component - Khối hiển thị danh sách các Mã Giảm Giá trên Trang Ưu Đãi
 * Tuân thủ quy định rangbuoc.txt: try-catch, kiểm tra lỗi, < 300 dòng
 */
const CouponSection = ({ onSelectCoupon }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState('');

  // Tải danh sách coupon đang hoạt động
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách coupon:', err);
      setError('Không thể tải danh sách mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Xử lý thông báo sao chép
  const handleCopied = (code) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 4000);
  };

  // Xử lý khi nhấn dùng ngay
  const handleUseNow = (code) => {
    if (onSelectCoupon) {
      onSelectCoupon(code);
    } else {
      const tourSection = document.getElementById('promotion-tours-section');
      if (tourSection) {
        tourSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Lọc coupon theo tiêu chí
  const filteredCoupons = coupons.filter((coupon) => {
    if (filterType === 'NO_MIN') {
      return !coupon.min_order_amount || coupon.min_order_amount === 0;
    }
    if (filterType === 'HIGH_DISCOUNT') {
      return (coupon.discount_percent || 0) >= 15;
    }
    if (filterType === 'EXPIRING_SOON') {
      if (!coupon.end_at) return false;
      const end = new Date(coupon.end_at);
      const now = new Date();
      const diffDays = (end - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    return true;
  });

  return (
    <section className="mb-5 pb-2">
      {/* Tiêu đề Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fs-4">🎟️</span>
            <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
              Kho Mã Giảm Giá Đặc Quyền
            </h2>
            <Badge bg="warning" text="dark" className="px-2 py-1 fw-bold">
              {coupons.length} Mã Hot
            </Badge>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
            Lấy mã ngay để nhận ưu đãi trực tiếp khi thanh toán các tour du lịch
          </p>
        </div>

        {/* Bộ lọc loại Coupon */}
        <div className="d-flex flex-wrap gap-2">
          <Button
            variant={filterType === 'ALL' ? 'warning' : 'outline-secondary'}
            size="sm"
            className="fw-bold px-3 py-1"
            style={filterType === 'ALL' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
            onClick={() => setFilterType('ALL')}
          >
            Tất Cả ({coupons.length})
          </Button>
          <Button
            variant={filterType === 'HIGH_DISCOUNT' ? 'warning' : 'outline-secondary'}
            size="sm"
            className="fw-bold px-3 py-1"
            style={filterType === 'HIGH_DISCOUNT' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
            onClick={() => setFilterType('HIGH_DISCOUNT')}
          >
            🔥 Giảm từ 15%
          </Button>
          <Button
            variant={filterType === 'NO_MIN' ? 'warning' : 'outline-secondary'}
            size="sm"
            className="fw-bold px-3 py-1"
            style={filterType === 'NO_MIN' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
            onClick={() => setFilterType('NO_MIN')}
          >
            ⚡ Không giới hạn đơn
          </Button>
          <Button
            variant={filterType === 'EXPIRING_SOON' ? 'warning' : 'outline-secondary'}
            size="sm"
            className="fw-bold px-3 py-1"
            style={filterType === 'EXPIRING_SOON' ? { backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
            onClick={() => setFilterType('EXPIRING_SOON')}
          >
            ⏳ Sắp hết hạn
          </Button>
        </div>
      </div>

      {/* Thông báo sao chép mã thành công */}
      {copiedCode && (
        <Alert
          variant="success"
          className="d-flex align-items-center justify-content-between py-2 px-3 shadow-sm mb-4"
          style={{ borderRadius: '10px', borderLeft: '4px solid #16a34a' }}
        >
          <div>
            🎉 <strong>Đã sao chép mã &quot;{copiedCode}&quot;!</strong> Mã đã sẵn sàng trong bộ nhớ tạm để bạn nhập tại bước Đặt tour.
          </div>
          <Button
            variant="outline-success"
            size="sm"
            className="fw-bold px-3"
            onClick={() => handleUseNow(copiedCode)}
          >
            Chọn tour ngay ↓
          </Button>
        </Alert>
      )}

      {/* Thông báo lỗi nếu có */}
      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      {/* Trạng thái tải dữ liệu */}
      {loading ? (
        <div className="text-center py-4 bg-light rounded-3">
          <Spinner animation="border" variant="warning" />
          <p className="mt-2 text-muted mb-0" style={{ fontSize: '13px' }}>
            Đang tải kho mã giảm giá...
          </p>
        </div>
      ) : filteredCoupons.length > 0 ? (
        <Row className="gy-4">
          {filteredCoupons.map((coupon) => (
            <Col key={coupon._id || coupon.code} lg={4} md={6} xs={12}>
              <CouponCard
                coupon={coupon}
                onCopied={handleCopied}
                onUseNow={handleUseNow}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-4 bg-light rounded-3 p-3">
          <span className="fs-2">🏷️</span>
          <h5 className="fw-bold text-dark mt-2">Chưa có mã giảm giá trong danh mục này</h5>
          <p className="text-muted mb-2" style={{ fontSize: '13px' }}>
            Bạn hãy chuyển sang xem &quot;Tất Cả&quot; hoặc quay lại sau để nhận thêm ưu đãi.
          </p>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setFilterType('ALL')}
          >
            Xem tất cả mã
          </Button>
        </div>
      )}
    </section>
  );
};

export default CouponSection;
