import { Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Bus, Tag } from 'lucide-react';

/**
 * CheckoutSummaryCard - Khối tóm tắt chi phí & Nút xác nhận đặt tour
 * - Chứa phần nhập mã giảm giá và hiển thị số tiền giảm
 * - Hiển thị đầy đủ thông tin: Ngày đi, Nơi khởi hành, Điểm đến, Thời lượng, Phương tiện, Chi tiết khách
 */
const CheckoutSummaryCard = ({
  selectedCartItems,
  subtotal,
  totalAmount,
  submitting,
  paymentType = 'FULL',
  couponCode = '',
  setCouponCode,
  discount = 0,
  appliedCoupon = '',
  couponMessage = '',
  couponError = false,
  onApplyCoupon,
  onRecommendCoupon,
  onRemoveCoupon,
  canBook = true,
}) => {
  const isDeposit = paymentType === 'DEPOSIT_30' || paymentType === 'DEPOSIT';
  const depositAmount = Math.ceil((totalAmount || 0) * 0.3);
  const remainingAmount = (totalAmount || 0) - depositAmount;
  const amountToPay = isDeposit ? depositAmount : (totalAmount || 0);
  // Format ngày đi
  const formatDepartureDate = (dateStr) => {
    if (!dateStr) return 'Chưa xác định';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Chưa xác định';
      return d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Chưa xác định';
    }
  };

  return (
    <div className="checkout-card" style={{ position: 'sticky', top: '120px' }}>
      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
        Tóm Tắt Đơn Đặt ({selectedCartItems.length} tour)
      </h3>

      <div className="mb-3" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        {selectedCartItems.map((item) => (
          <div
            key={item._id}
            className="mb-3 p-3"
            style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}
          >
            {/* Tên Tour */}
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>
              {item.title}
            </div>

            {/* Thông tin chuyến đi */}
            <div className="d-flex flex-column gap-1 mb-2" style={{ fontSize: '12.5px', color: '#475569' }}>
              <div className="d-flex align-items-center gap-2">
                <Calendar size={14} color="#ea580c" />
                <span>Ngày đi: <strong className="text-dark">{formatDepartureDate(item.departure_date)}</strong></span>
              </div>
              {item.departure_location && (
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={14} color="#0284c7" />
                  <span>Từ: <strong className="text-dark">{item.departure_location}</strong></span>
                </div>
              )}
              {item.destination_location && (
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={14} color="#16a34a" />
                  <span>Đến: <strong className="text-dark">{item.destination_location}</strong></span>
                </div>
              )}
              {item.duration && (
                <div className="d-flex align-items-center gap-2">
                  <Clock size={14} color="#8b5cf6" />
                  <span>Thời gian: <strong className="text-dark">{item.duration}</strong></span>
                </div>
              )}
              {item.vehicle && (
                <div className="d-flex align-items-center gap-2">
                  <Bus size={14} color="#eab308" />
                  <span>Phương tiện: <strong className="text-dark">{item.vehicle}</strong></span>
                </div>
              )}
            </div>

            {/* Chi tiết số lượng khách & Đơn giá */}
            <div
              className="mt-2 pt-2"
              style={{ borderTop: '1px dashed #cbd5e1', fontSize: '12.5px', color: '#334155' }}
            >
              <div className="d-flex align-items-center gap-1 mb-1">
                <Users size={13} color="#64748b" />
                <span style={{ fontWeight: 600 }}>Chi tiết hành khách:</span>
              </div>
              <div className="ps-3">
                <div>
                  • {item.quantity_adult || 1} người lớn × {(item.price_adult || item.price || 0).toLocaleString('vi-VN')} đ
                </div>
                {item.quantity_child > 0 && (
                  <div>
                    • {item.quantity_child} trẻ em × {(item.price_child || Math.round((item.price_adult || 0) * 0.7)).toLocaleString('vi-VN')} đ
                  </div>
                )}
                {item.quantity_baby > 0 && (
                  <div>
                    • {item.quantity_baby} em bé × {(item.price_baby || Math.round((item.price_adult || 0) * 0.3)).toLocaleString('vi-VN')} đ
                  </div>
                )}
              </div>
            </div>

            {/* Thành tiền tour */}
            <div
              className="d-flex justify-content-between align-items-center mt-2 pt-2"
              style={{ borderTop: '1px solid #e2e8f0' }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Thành tiền:</span>
              <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#ea580c' }}>
                {(item.item_total || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Phần nhập mã giảm giá trong tóm tắt tour */}
      <div
        className="mb-3 p-3"
        style={{
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2" style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
            <Tag size={15} color="#ea580c" />
            <span>Mã giảm giá ưu đãi</span>
          </div>
          {onRecommendCoupon && !appliedCoupon && (
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              style={{ fontSize: '12px', color: '#ea580c', fontWeight: 700, cursor: 'pointer' }}
              onClick={onRecommendCoupon}
              title="Tìm mã giảm giá tiết kiệm nhất cho đơn này"
            >
              ⚡ Gợi ý mã tốt nhất
            </button>
          )}
        </div>

        {appliedCoupon ? (
          <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
            <div>
              <span className="badge bg-success me-2">{appliedCoupon}</span>
              <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 600 }}>
                Giảm: -{discount.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}
              onClick={onRemoveCoupon}
              title="Xóa mã giảm giá"
            >
              ✕ Bỏ mã
            </button>
          </div>
        ) : (
          <div className="d-flex gap-2">
            <input
              type="text"
              placeholder="VD: TOURMUAHE2024"
              value={couponCode}
              onChange={(e) => setCouponCode && setCouponCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (onApplyCoupon) onApplyCoupon();
                }
              }}
              style={{
                flex: 1,
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12.5px',
              }}
            />
            <button
              type="button"
              className="btn btn-dark btn-sm"
              style={{ fontSize: '12.5px', padding: '6px 14px', borderRadius: '6px', fontWeight: 600 }}
              onClick={onApplyCoupon}
              disabled={!couponCode.trim()}
            >
              Áp dụng
            </button>
          </div>
        )}

        {couponMessage && (
          <div
            style={{
              fontSize: '12px',
              marginTop: '6px',
              color: couponError ? '#dc2626' : '#16a34a',
              fontWeight: 600,
            }}
          >
            {couponMessage}
          </div>
        )}
      </div>

      {/* Chi tiết thanh toán */}
      <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px', color: '#64748b' }}>
        <span>Tạm tính:</span>
        <span style={{ fontWeight: 700, color: '#1e293b' }}>{subtotal.toLocaleString('vi-VN')} đ</span>
      </div>

      {discount > 0 && (
        <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px', color: '#16a34a' }}>
          <span>Giảm giá ({appliedCoupon}):</span>
          <span style={{ fontWeight: 700 }}>-{discount.toLocaleString('vi-VN')} đ</span>
        </div>
      )}

      <div
        className="d-flex justify-content-between pt-3 mb-2"
        style={{ borderTop: '1px solid #e2e8f0', fontSize: '15px' }}
      >
        <span style={{ fontWeight: 700, color: '#1e293b' }}>Tổng đơn hàng:</span>
        <span style={{ fontWeight: 800, fontSize: '17px', color: '#1e293b' }}>
          {(totalAmount || 0).toLocaleString('vi-VN')} đ
        </span>
      </div>

      {/* Hiển thị số tiền thực tế cần thanh toán ngay */}
      {isDeposit ? (
        <div className="deposit-info-box mb-4">
          <div>🧾 Mức thanh toán: <strong>Đặt cọc 30%</strong></div>
          <div className="mt-1">Thanh toán ngay: <span className="deposit-pay-now">{depositAmount.toLocaleString('vi-VN')} đ</span></div>
          <div className="deposit-remaining">Còn lại: {remainingAmount.toLocaleString('vi-VN')} đ — hạn thanh toán đủ trước D-16</div>
        </div>
      ) : (
        <div className="d-flex justify-content-between mb-4 pt-2" style={{ fontSize: '16px' }}>
          <span style={{ fontWeight: 800, color: '#1e293b' }}>Thanh toán ngay:</span>
          <span style={{ fontWeight: 900, fontSize: '20px', color: '#ea580c' }}>
            {amountToPay.toLocaleString('vi-VN')} đ
          </span>
        </div>
      )}

      <button
        type="submit"
        className="checkout-btn-submit"
        disabled={submitting || selectedCartItems.length === 0 || !canBook}
        style={!canBook ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
      >
        {submitting ? (
          <span className="d-flex align-items-center justify-content-center gap-2">
            <Spinner animation="border" size="sm" />
            Đang xử lý đơn...
          </span>
        ) : !canBook ? (
          'Không thể đặt tour (còn dưới 5 ngày)'
        ) : isDeposit ? (
          `Đặt Cọc ${depositAmount.toLocaleString('vi-VN')} đ Ngay`
        ) : (
          'Xác Nhận Đặt Tour'
        )}
      </button>

      <div className="text-center mt-3">
        <Link to="/gio-hang" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none' }}>
          &larr; Quay lại giỏ hàng
        </Link>
      </div>
    </div>
  );
};

export default CheckoutSummaryCard;
