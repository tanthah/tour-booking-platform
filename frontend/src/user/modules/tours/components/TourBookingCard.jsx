import { Button } from 'react-bootstrap';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  Minus,
  Plus,
  CreditCard,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react';
import FavoriteButton from '../../wishlist/components/FavoriteButton';

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
  handleBuyNow,
  addingToCart,
  buyingNow,
  isAddedToCart,
}) => {
  const availableSlots = selectedDeparture
    ? (selectedDeparture.available_slots ?? (selectedDeparture.total_slots - selectedDeparture.booked_slots - selectedDeparture.reserved_slots))
    : 0;
  const isBusy = addingToCart || buyingNow;

  return (
    <div className="tour-booking-card">
      <h3 className="tour-booking-title">
        <Calendar size={20} />
        <span>Chuyến Đi Của Bạn</span>
      </h3>

      {/* 1. LỊCH KHỞI HÀNH (Hiển thị ngay phía trên của khung đặt tour) */}
      <div className="tour-departure-schedule mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="tour-departure-heading m-0">
            <Calendar size={16} className="text-warning me-1" />
            Lịch Khởi Hành
          </h4>
          <span className="tour-departure-count-pill">
            {departures?.length || 0} đợt khả dụng
          </span>
        </div>

        {departures && departures.length > 0 ? (
          <div className="tour-departure-list-scroll">
            {departures.map((dep) => {
              const isSelected = selectedDeparture?._id === dep._id;
              const currentSlots = dep.available_slots ?? (dep.total_slots - dep.booked_slots - dep.reserved_slots);
              const isAvailable = currentSlots > 0 && dep.status === 'OPEN';
              const depDate = new Date(dep.start_datetime || dep.departure_date);
              const dayOfWeek = depDate.toLocaleDateString('vi-VN', { weekday: 'short' });
              const dateStr = depDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = depDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const meetingPoint = dep.meeting_point || dep.meeting_point_address;

              return (
                <div
                  key={dep._id}
                  onClick={() => {
                    if (isAvailable) setSelectedDeparture(dep);
                  }}
                  className={`tour-departure-item ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <div className="min-w-0">
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        <span className="tour-departure-weekday">{dayOfWeek}</span>
                        <strong className="tour-departure-date">{dateStr}</strong>
                        <span className="text-muted" style={{ fontSize: '12px' }}>({timeStr})</span>
                        {isSelected && (
                          <CheckCircle2 size={14} className="text-success" />
                        )}
                      </div>
                      {meetingPoint && (
                        <div className="tour-departure-subinfo text-truncate" title={meetingPoint}>
                          📍 Tập trung: {meetingPoint}
                        </div>
                      )}
                    </div>
                    <div className="text-end flex-shrink-0">
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
        <div className="min-w-0" style={{ flex: 1 }}>
          <h5 className="tour-booking-mini-title">{tour.title}</h5>
          <div className="d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
            {selectedDeparture && <CheckCircle2 size={14} className="text-success flex-shrink-0" />}
            <span style={{ color: selectedDeparture ? '#16a34a' : '#64748b', fontWeight: 600 }}>
              {selectedDeparture ? `Đã chọn đợt: còn ${availableSlots} chỗ` : 'Vui lòng chọn ngày khởi hành'}
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin thông số tour */}
      <div className="tour-booking-info-box mb-3">
        <div className="tour-booking-info-row">
          <span className="tour-booking-info-label">
            <Clock size={14} /> Thời gian:
          </span>
          <strong className="tour-booking-info-val">{tour.duration}</strong>
        </div>
        <div className="tour-booking-info-row">
          <span className="tour-booking-info-label">
            <MapPin size={14} /> Điểm đến:
          </span>
          <strong className="tour-booking-info-val">{tour.destination_location}</strong>
        </div>
        {selectedDeparture && (
          <>
            <div className="tour-booking-info-row">
              <span className="tour-booking-info-label">
                <Clock size={14} /> Thời gian bắt đầu:
              </span>
              <strong className="tour-booking-info-val">
                {new Date(selectedDeparture.start_datetime || selectedDeparture.departure_date).toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </strong>
            </div>
            {(selectedDeparture.meeting_point || selectedDeparture.meeting_point_address) && (
              <div className="tour-booking-meeting-box">
                <div className="tour-booking-meeting-label">
                  <MapPin size={14} className="text-danger flex-shrink-0" />
                  <span>Địa điểm tập trung:</span>
                </div>
                <div className="tour-booking-meeting-address">
                  {selectedDeparture.meeting_point || selectedDeparture.meeting_point_address}
                </div>
                <div className="tour-booking-meeting-note">
                  * Khách tự túc di chuyển đến địa điểm tập trung đúng giờ.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. BỘ CHỌN SỐ LƯỢNG HÀNH KHÁCH */}
      <div className="mb-3">
        <div className="tour-booking-pax-heading">Số Lượng Hành Khách</div>

        {[
          {
            key: 'adult',
            label: 'Người lớn',
            qty: adults,
            price: unitPrice,
            onDec: () => setAdults(Math.max(1, adults - 1)),
            onInc: () => { if (canAddPassenger) setAdults(adults + 1); },
            min: 1,
          },
          {
            key: 'child',
            label: 'Trẻ em',
            qty: children,
            price: childPrice,
            onDec: () => setChildren(Math.max(0, children - 1)),
            onInc: () => { if (canAddPassenger) setChildren(children + 1); },
            min: 0,
          },
          {
            key: 'baby',
            label: 'Em bé',
            qty: babies,
            price: babyPrice,
            onDec: () => setBabies(Math.max(0, babies - 1)),
            onInc: () => { if (canAddPassenger) setBabies(babies + 1); },
            min: 0,
          },
        ].map((row) => (
          <div key={row.key} className="tour-booking-pax-row">
            <span className="tour-booking-pax-name">
              <Users size={15} className="tour-booking-pax-icon" />
              <span>{row.label}</span>
            </span>

            <div className="tour-booking-stepper">
              <button
                type="button"
                className="tour-booking-qty-btn"
                onClick={row.onDec}
                disabled={row.qty <= row.min}
                aria-label={`Giảm số lượng ${row.label}`}
              >
                <Minus size={12} />
              </button>
              <span className="tour-booking-qty-val">{row.qty}</span>
              <button
                type="button"
                className="tour-booking-qty-btn"
                onClick={row.onInc}
                disabled={!canAddPassenger}
                aria-label={`Tăng số lượng ${row.label}`}
              >
                <Plus size={12} />
              </button>
            </div>

            <span className="tour-booking-pax-price">
              {row.qty} x {row.price.toLocaleString('vi-VN')} đ
            </span>
          </div>
        ))}
      </div>

      {/* 4. TỔNG CỘNG VÀ NÚT HÀNH ĐỘNG */}
      <div className="tour-booking-total-row">
        <span className="tour-booking-total-label">Tổng cộng:</span>
        <span className="tour-booking-total">{totalPrice.toLocaleString('vi-VN')} đ</span>
      </div>

      <div className="d-flex gap-2 mt-3 align-items-center">
        <FavoriteButton tour={tour} className="tour-booking-wishlist-btn" />

        <Button
          onClick={handleBuyNow}
          className="tour-booking-buy-btn flex-grow-1 d-flex justify-content-center align-items-center gap-2 m-0"
          disabled={!selectedDeparture || availableSlots <= 0 || isBusy}
        >
          <CreditCard size={17} />
          <span>
            {!selectedDeparture
              ? 'Chọn Ngày Khởi Hành'
              : availableSlots <= 0
              ? 'Đợt Này Đã Hết Chỗ'
              : buyingNow
              ? 'Đang chuyển...'
              : 'Thanh toán ngay'}
          </span>
          {selectedDeparture && availableSlots > 0 && !buyingNow && <ArrowRight size={16} />}
        </Button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className="tour-booking-cart-btn mt-2"
        disabled={!selectedDeparture || availableSlots <= 0 || isBusy}
      >
        <ShoppingCart size={17} />
        <span>
          {addingToCart
            ? 'Đang thêm...'
            : isAddedToCart
            ? 'Đã Thêm Vào Giỏ Hàng'
            : 'Thêm Vào Giỏ Hàng'}
        </span>
      </button>
    </div>
  );
};

export default TourBookingCard;
