import { Form, Button } from 'react-bootstrap';
import { Heart } from 'lucide-react';

/**
 * TourBookingCard Component - Khối đặt tour và chọn số lượng hành khách
 * Hiển thị giá tour, lựa chọn nơi khởi hành, số lượng người lớn/trẻ em/em bé
 */
const TourBookingCard = ({
  tour,
  departures,
  selectedDeparture,
  setSelectedDeparture,
  adults,
  setAdults,
  children,
  setChildren,
  babies,
  setBabies,
  unitPrice,
  childPrice,
  babyPrice,
  totalPrice,
  canAddPassenger,
  handleAddToCart,
  addingToCart,
  isAddedToCart,
}) => {
  const availableSlots = selectedDeparture ? selectedDeparture.available_slots : 0;
  
  return (
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
            <span style={{ color: '#64748b' }}>Còn {availableSlots} chỗ trống</span>
          </div>
        </div>
      </div>

      {/* Chọn đợt khởi hành */}
      <Form.Group className="mb-3">
        <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
          Chọn Đợt Khởi Hành:
        </Form.Label>
        {departures && departures.length > 0 ? (
          <Form.Select
            value={selectedDeparture ? selectedDeparture._id : ''}
            onChange={(e) => {
              const dep = departures.find(d => d._id === e.target.value);
              setSelectedDeparture(dep);
            }}
            style={{ borderRadius: '8px', fontSize: '13px' }}
          >
            {departures.map(dep => (
              <option key={dep._id} value={dep._id}>
                {new Date(dep.departure_date).toLocaleDateString('vi-VN')} - {dep.departure_location}
              </option>
            ))}
          </Form.Select>
        ) : (
          <div style={{ fontSize: '13px', color: '#dc3545' }}>Hiện chưa có đợt khởi hành nào.</div>
        )}
      </Form.Group>

      {/* Thông tin thông số tour (của đợt đã chọn) */}
      <div className="mb-3">
        <div className="tour-booking-meta-row">
          <span>Mã Tour:</span> <strong className="text-dark">{tour.code}</strong>
        </div>
        <div className="tour-booking-meta-row">
          <span>Thời Gian:</span> <strong className="text-dark">{tour.duration}</strong>
        </div>
        <div className="tour-booking-meta-row">
          <span>Điểm Đến:</span> <strong className="text-dark">{tour.destination_location}</strong>
        </div>
        {selectedDeparture && (
          <>
            <div className="tour-booking-meta-row">
              <span>Phương Tiện:</span> <strong className="text-dark">{selectedDeparture.vehicle || 'Ô tô'}</strong>
            </div>
            <div className="tour-booking-meta-row">
              <span>Khởi hành từ:</span> <strong className="text-dark">{selectedDeparture.departure_location}</strong>
            </div>
          </>
        )}
      </div>

      {/* Bộ chọn số lượng hành khách */}
      <div className="mb-3">
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
          Số Lượng Hành Khách
        </div>

        {/* Người lớn */}
        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '13px' }}>
          <span style={{ minWidth: '70px' }}>Người lớn:</span>
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
              onClick={() => { if (canAddPassenger) setAdults(adults + 1); }}
            >
              +
            </button>
          </div>
          <span style={{ color: '#ea580c', fontWeight: 600 }}>
            {adults} x {unitPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Trẻ em */}
        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '13px' }}>
          <span style={{ minWidth: '70px' }}>Trẻ em:</span>
          <div className="d-flex align-items-center gap-2">
            <button
              className="tour-booking-qty-btn"
              onClick={() => setChildren(Math.max(0, children - 1))}
            >
              -
            </button>
            <span style={{ width: '20px', textAlign: 'center', fontWeight: 700 }}>{children}</span>
            <button
              className="tour-booking-qty-btn"
              onClick={() => { if (canAddPassenger) setChildren(children + 1); }}
            >
              +
            </button>
          </div>
          <span style={{ color: '#ea580c', fontWeight: 600 }}>
            {children} x {childPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Em bé */}
        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '13px' }}>
          <span style={{ minWidth: '70px' }}>Em bé:</span>
          <div className="d-flex align-items-center gap-2">
            <button
              className="tour-booking-qty-btn"
              onClick={() => setBabies(Math.max(0, babies - 1))}
            >
              -
            </button>
            <span style={{ width: '20px', textAlign: 'center', fontWeight: 700 }}>{babies}</span>
            <button
              className="tour-booking-qty-btn"
              onClick={() => { if (canAddPassenger) setBabies(babies + 1); }}
            >
              +
            </button>
          </div>
          <span style={{ color: '#ea580c', fontWeight: 600 }}>
            {babies} x {babyPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* Tổng cộng và Nút Thêm Vào Giỏ */}
      <div className="d-flex justify-content-between align-items-center pt-3 border-top">
        <span style={{ fontSize: '15px', fontWeight: 700 }}>Tổng cộng:</span>
        <span className="tour-booking-total">{totalPrice.toLocaleString('vi-VN')} đ</span>
      </div>

      <div className="d-flex gap-2 mt-3">
        <Button
          onClick={handleAddToCart}
          className="tour-booking-submit-btn flex-grow-1 d-flex justify-content-center align-items-center m-0"
          disabled={availableSlots <= 0 || addingToCart}
        >
          {availableSlots <= 0
            ? 'Đợt Này Đã Hết Chỗ'
            : addingToCart
            ? 'Đang thêm...'
            : isAddedToCart
            ? 'Đã Thêm Vào Giỏ Hàng'
            : 'Thêm Vào Giỏ Hàng'}
        </Button>

        {/* Nút yêu thích */}
        <Button
          variant="outline-danger"
          className="d-flex justify-content-center align-items-center m-0"
          style={{ width: '48px', borderRadius: '10px' }}
          title="Thêm vào danh sách yêu thích"
        >
          <Heart size={20} />
        </Button>
      </div>
    </div>
  );
};

export default TourBookingCard;
