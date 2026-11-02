import { Form, Button } from 'react-bootstrap';
import { Heart, Calendar, Clock, MapPin, Car, CheckCircle2 } from 'lucide-react';

/**
 * TourBookingCard Component - Khối đặt tour và chọn số lượng hành khách
 * Phía trên cùng hiển thị Lịch Khởi Hành trực quan
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

      {/* 1. LỊCH KHỞI HÀNH (Hiển thị ngay phía trên của khung đặt tour) */}
      <div className="tour-departure-schedule mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="tour-departure-heading m-0">
            <Calendar size={17} className="text-warning me-1" />
            Lịch Khởi Hành
          </h4>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              background: '#fff7ed',
              color: '#ea580c',
              border: '1px solid #fed7aa',
              padding: '2px 8px',
              borderRadius: '20px',
            }}
          >
            {departures?.length || 0} đợt khả dụng
          </span>
        </div>

        {departures && departures.length > 0 ? (
          <div className="tour-departure-list-scroll">
            {departures.map((dep) => {
              const isSelected = selectedDeparture?._id === dep._id;
              const isAvailable = (dep.available_slots ?? (dep.total_slots - dep.booked_slots - dep.reserved_slots)) > 0 && dep.status === 'OPEN';
              const depDate = new Date(dep.departure_date);
              const dayOfWeek = depDate.toLocaleDateString('vi-VN', { weekday: 'short' });
              const dateStr = depDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const currentSlots = dep.available_slots ?? (dep.total_slots - dep.booked_slots - dep.reserved_slots);

              return (
                <div
                  key={dep._id}
                  onClick={() => {
                    if (isAvailable) setSelectedDeparture(dep);
                  }}
                  className={`tour-departure-item ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center gap-1">
                        <span className="tour-departure-weekday">{dayOfWeek}</span>
                        <strong className="tour-departure-date">{dateStr}</strong>
                        {isSelected && (
                          <CheckCircle2 size={14} className="text-success ms-1" />
                        )}
                      </div>
                      <div className="tour-departure-subinfo">
                        <span>{dep.departure_location}</span>
                        {dep.vehicle && <span> • {dep.vehicle}</span>}
                      </div>
                    </div>
                    <div className="text-end">
                      {isAvailable ? (
                        <span className="badge-available">Còn {currentSlots} chỗ</span>
                      ) : (
                        <span className="badge-soldout">Hết chỗ</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="alert alert-warning py-2 px-3 m-0" style={{ fontSize: '12.5px' }}>
            Hiện chưa có đợt khởi hành nào. Quý khách vui lòng liên hệ tư vấn.
          </div>
        )}
      </div>

      {/* 2. THÔNG TIN TOUR ĐÃ CHỌN */}
      <div className="tour-booking-mini-item">
        <img src={tour.main_image} alt={tour.title} className="tour-booking-mini-img" />
        <div style={{ flex: 1 }}>
          <h5 style={{ fontSize: '13.5px', fontWeight: 700, margin: '0 0 4px', color: '#1e293b', lineHeight: 1.3 }}>
            {tour.title}
          </h5>
          <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '12px' }}>
            <span style={{ color: selectedDeparture ? '#16a34a' : '#64748b', fontWeight: 600 }}>
              {selectedDeparture ? `Đã chọn đợt: còn ${availableSlots} chỗ` : 'Vui lòng chọn ngày khởi hành'}
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin thông số tour */}
      <div className="mb-3 p-2 rounded bg-light" style={{ fontSize: '12.5px' }}>
        <div className="d-flex justify-content-between py-1">
          <span className="text-muted d-flex align-items-center gap-1">
            <Clock size={13} /> Thời gian:
          </span>
          <strong className="text-dark">{tour.duration}</strong>
        </div>
        <div className="d-flex justify-content-between py-1">
          <span className="text-muted d-flex align-items-center gap-1">
            <MapPin size={13} /> Điểm đến:
          </span>
          <strong className="text-dark">{tour.destination_location}</strong>
        </div>
        {selectedDeparture && (
          <>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted d-flex align-items-center gap-1">
                <Car size={13} /> Phương tiện:
              </span>
              <strong className="text-dark">{selectedDeparture.vehicle || 'Ô tô'}</strong>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted d-flex align-items-center gap-1">
                <Calendar size={13} /> Khởi hành từ:
              </span>
              <strong className="text-dark">{selectedDeparture.departure_location}</strong>
            </div>
          </>
        )}
      </div>

      {/* 3. BỘ CHỌN SỐ LƯỢNG HÀNH KHÁCH */}
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

      {/* 4. TỔNG CỘNG VÀ NÚT ĐẶT TOUR */}
      <div className="d-flex justify-content-between align-items-center pt-3 border-top">
        <span style={{ fontSize: '15px', fontWeight: 700 }}>Tổng cộng:</span>
        <span className="tour-booking-total">{totalPrice.toLocaleString('vi-VN')} đ</span>
      </div>

      <div className="d-flex gap-2 mt-3">
        <Button
          onClick={handleAddToCart}
          className="tour-booking-submit-btn flex-grow-1 d-flex justify-content-center align-items-center m-0"
          disabled={!selectedDeparture || availableSlots <= 0 || addingToCart}
        >
          {!selectedDeparture
            ? 'Vui Lòng Chọn Ngày Khởi Hành'
            : availableSlots <= 0
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
