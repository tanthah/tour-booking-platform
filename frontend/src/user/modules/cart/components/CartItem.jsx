import { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Bus,
  Users,
  Trash2,
  Minus,
  Plus,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import axiosClient from '../../../config/axiosClient';
import '../../../assets/styles/cart.css';

/**
 * CartItem Component - Hiển thị một item tour trong giỏ hàng theo layout hiện đại
 */
const CartItem = ({ item, isSelected, onToggleSelect, onUpdateQuantity, onRemove, actionLoading }) => {
  const [showDepPicker, setShowDepPicker] = useState(false);
  const [departures, setDepartures] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Liên hệ';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const handleOpenDeparturePicker = async () => {
    if (showDepPicker) {
      setShowDepPicker(false);
      return;
    }

    setShowDepPicker(true);
    setLoadingDeps(true);
    try {
      const res = await axiosClient.get(`/tours/${item.tour_id}/departures/public`);
      const list = Array.isArray(res?.data) ? res.data : [];
      setDepartures(list.filter((dep) => dep.available_slots > 0));
    } catch {
      setDepartures([]);
    } finally {
      setLoadingDeps(false);
    }
  };

  const handleSelectDeparture = async (newDepartureId) => {
    if (!newDepartureId) return;
    await onUpdateQuantity(item._id, { departure_id: newDepartureId });
    setShowDepPicker(false);
  };

  const qtyAdult = item.quantity_adult !== undefined && item.quantity_adult !== null
    ? item.quantity_adult
    : (item.quantity || 1);
  const qtyChild = item.quantity_child || 0;
  const qtyBaby = item.quantity_baby || 0;

  const adultPrice = item.price_adult ?? item.price ?? 0;
  const childPrice = item.price_child ?? Math.round(adultPrice * 0.6);
  const babyPrice = item.price_baby ?? Math.round(adultPrice * 0.2);

  const totalPassengers = qtyAdult + qtyChild + qtyBaby;
  const canAddPassenger = !item.remaining_slots || totalPassengers < item.remaining_slots;
  const itemTotal = item.item_total ?? ((qtyAdult * adultPrice) + (qtyChild * childPrice) + (qtyBaby * babyPrice));

  const passengerRows = [
    {
      key: 'adult',
      label: 'Người lớn',
      unitPrice: adultPrice,
      qty: qtyAdult,
      min: 1,
      field: 'quantity_adult',
      incTitle: 'Tăng số lượng người lớn',
      decTitle: 'Giảm số lượng người lớn',
    },
    {
      key: 'child',
      label: 'Trẻ em',
      unitPrice: childPrice,
      qty: qtyChild,
      min: 0,
      field: 'quantity_child',
      incTitle: 'Tăng số lượng trẻ em',
      decTitle: 'Giảm số lượng trẻ em',
    },
    {
      key: 'baby',
      label: 'Em bé',
      unitPrice: babyPrice,
      qty: qtyBaby,
      min: 0,
      field: 'quantity_baby',
      incTitle: 'Tăng số lượng em bé',
      decTitle: 'Giảm số lượng em bé',
    },
  ];

  const locationLabel = item.destination_location || item.departure_location;

  return (
    <div className={`cart-item-card ${isSelected ? 'is-selected' : ''}`}>
      {/* Cột 1: Checkbox + Ảnh */}
      <div className="cart-item-media">
        <input
          type="checkbox"
          className="cart-item-checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item._id)}
          aria-label={`Chọn tour ${item.title}`}
        />
        <img src={item.main_image} alt={item.title} className="cart-item-image" />
      </div>

      {/* Cột 2: Thông tin tour & thẻ pill */}
      <div className="cart-item-info">
        <h3 className="cart-item-title">{item.title}</h3>

        <div className="cart-item-meta-line">
          <span className="cart-meta-piece">
            <MapPin size={14} className="cart-meta-icon-orange" />
            <span>Mã Tour:</span>
            <strong>{item.code}</strong>
          </span>
          <span className={`cart-meta-piece ${item.is_departure_passed ? 'cart-meta-expired' : ''}`}>
            <Calendar size={14} className="cart-meta-icon-orange" />
            <span>Ngày khởi hành:</span>
            <strong>
              {formatDate(item.departure_date)}
              {item.is_departure_passed ? ' (Đã qua)' : ''}
            </strong>
          </span>
          {item.is_departure_passed && (
            <button
              type="button"
              className="cart-change-dep-btn"
              onClick={handleOpenDeparturePicker}
              disabled={actionLoading}
            >
              <RefreshCw size={12} />
              <span>Chọn ngày khởi hành khác</span>
            </button>
          )}
        </div>

        {showDepPicker && (
          <div className="cart-dep-picker">
            {loadingDeps ? (
              <span className="cart-dep-status-text">Đang tải lịch khởi hành...</span>
            ) : departures.length === 0 ? (
              <span className="cart-dep-status-text">Hiện chưa có ngày khởi hành mới khả dụng.</span>
            ) : (
              <select
                className="cart-dep-select"
                defaultValue=""
                disabled={actionLoading}
                onChange={(e) => handleSelectDeparture(e.target.value)}
                aria-label="Chọn ngày khởi hành khác"
              >
                <option value="" disabled>
                  -- Chọn ngày khởi hành mới --
                </option>
                {departures.map((dep) => (
                  <option key={dep._id} value={dep._id}>
                    {formatDate(dep.start_datetime)} (Còn {dep.available_slots} chỗ)
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="cart-dep-close-btn"
              onClick={() => setShowDepPicker(false)}
            >
              Đóng
            </button>
          </div>
        )}

        {(item.meeting_point || item.departure_location) && (
          <div className="cart-item-meeting">
            Điểm tập trung: <strong>{item.meeting_point || item.departure_location}</strong>
          </div>
        )}

        <div className="cart-item-badges">
          <span className="cart-pill-badge cart-pill-yellow">
            <Bus size={13} />
            <span>{item.vehicle || 'Tour trọn gói'}</span>
          </span>
          {item.duration && (
            <span className="cart-pill-badge cart-pill-orange">
              <Clock size={13} />
              <span>{item.duration}</span>
            </span>
          )}
          {locationLabel && (
            <span className="cart-pill-badge cart-pill-rose">
              <MapPin size={13} />
              <span>{locationLabel}</span>
            </span>
          )}
        </div>

        {item.is_departure_passed && (
          <div className="cart-item-warning">
            <AlertTriangle size={14} />
            <span>Tour đã qua ngày khởi hành. Vui lòng chọn ngày khởi hành khác.</span>
          </div>
        )}
      </div>

      {/* Cột 3: Bộ chọn số lượng hành khách */}
      <div className="cart-item-passengers">
        <div className="cart-passenger-heading">Số lượng khách</div>

        <div className="cart-passenger-list">
          {passengerRows.map((row) => (
            <div key={row.key} className="cart-passenger-row">
              <div className="cart-passenger-type">
                <Users size={15} className="cart-passenger-icon" />
                <div>
                  <div className="cart-passenger-name">{row.label}</div>
                  <div className="cart-passenger-unit">
                    {row.unitPrice.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              <div className="cart-stepper">
                <button
                  type="button"
                  className="cart-stepper-btn"
                  onClick={() => {
                    if (row.qty > row.min) {
                      onUpdateQuantity(item._id, { [row.field]: row.qty - 1 });
                    }
                  }}
                  disabled={actionLoading || row.qty <= row.min}
                  title={row.decTitle}
                  aria-label={row.decTitle}
                >
                  <Minus size={13} />
                </button>
                <span className="cart-stepper-value">{row.qty}</span>
                <button
                  type="button"
                  className="cart-stepper-btn is-plus"
                  onClick={() => onUpdateQuantity(item._id, { [row.field]: row.qty + 1 })}
                  disabled={actionLoading || !canAddPassenger}
                  title={row.incTitle}
                  aria-label={row.incTitle}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cột 4: Thành tiền & nút xóa */}
      <div className="cart-item-total-col">
        <div className="cart-item-total-top">
          <span className="cart-total-label">Thành tiền</span>
          <button
            type="button"
            className="cart-item-trash-btn"
            onClick={() => onRemove(item._id)}
            disabled={actionLoading}
            title="Xóa khỏi giỏ hàng"
            aria-label={`Xóa tour ${item.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="cart-item-price-block">
          <div className="cart-item-price">
            {itemTotal.toLocaleString('vi-VN')} đ
          </div>
          <div className="cart-item-pax-summary">
            {totalPassengers} hành khách
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
