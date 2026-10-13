import '../assets/styles/cart.css';

/**
 * CartItem Component - Hiển thị một item tour trong giỏ hàng
 * Bao gồm: ảnh, thông tin tour, cảnh báo ngày khởi hành, số lượng hành khách
 */
const CartItem = ({ item, isSelected, onToggleSelect, onUpdateQuantity, onRemove, actionLoading }) => {
  // Format ngày tháng theo định dạng Việt Nam
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Liên hệ';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const qtyAdult = item.quantity_adult !== undefined && item.quantity_adult !== null
    ? item.quantity_adult
    : (item.quantity || 1);
  const qtyChild = item.quantity_child || 0;
  const qtyBaby = item.quantity_baby || 0;

  const adultPrice = item.price_adult || item.price || 0;
  const childPrice = item.price_child || Math.round(adultPrice * 0.7);
  const babyPrice = item.price_baby || Math.round(adultPrice * 0.3);

  const totalPassengers = qtyAdult + qtyChild + qtyBaby;
  const canAddPassenger = !item.remaining_slots || totalPassengers < item.remaining_slots;

  return (
    <div className="cart-item">
      {/* Nút xóa item */}
      <button
        className="cart-item-remove"
        onClick={() => onRemove(item._id)}
        disabled={actionLoading}
        title="Xóa khỏi giỏ hàng"
      >
        &times;
      </button>

      {/* Checkbox chọn thanh toán */}
      <input
        type="checkbox"
        className="cart-item-checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(item._id)}
      />

      {/* Ảnh tour */}
      <img src={item.main_image} alt={item.title} className="cart-item-image" />

      {/* Thông tin tour */}
      <div className="cart-item-info">
        <div className="cart-item-title">{item.title}</div>
        <div className="cart-item-meta">
          Mã Tour: <strong>{item.code}</strong>
        </div>
        <div className="cart-item-meta">
          Ngày Khởi Hành: <strong>{formatDate(item.departure_date)}</strong>
        </div>
        <div className="cart-item-meta">
          Khởi Hành Tại: <strong>{item.departure_location}</strong>
        </div>
        {/* Cảnh báo tour đã qua ngày khởi hành */}
        {item.is_departure_passed && (
          <div className="cart-item-warning">
            Tour đã qua ngày khởi hành. Vui lòng chọn ngày khởi hành khác.
          </div>
        )}
      </div>

      {/* Số lượng hành khách */}
      <div className="cart-item-passengers">
        <div className="cart-passenger-label">Số Lượng Hành Khách</div>

        {/* Người lớn */}
        <div className="cart-passenger-row">
          <span>Người lớn:</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '18px', textAlign: 'center', fontWeight: 700 }}>
              {qtyAdult}
            </span>
            <div className="d-flex flex-column">
              <button
                className="cart-qty-btn"
                style={{ marginBottom: '2px', height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => onUpdateQuantity(item._id, { quantity_adult: qtyAdult + 1 })}
                disabled={actionLoading || !canAddPassenger}
                title="Tăng số lượng người lớn"
              >&#9650;</button>
              <button
                className="cart-qty-btn"
                style={{ height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => {
                  if (qtyAdult > 1) onUpdateQuantity(item._id, { quantity_adult: qtyAdult - 1 });
                }}
                disabled={actionLoading || qtyAdult <= 1}
                title="Giảm số lượng người lớn"
              >&#9660;</button>
            </div>
          </div>
          <span className="cart-passenger-price">
            {qtyAdult} x {adultPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Trẻ em */}
        <div className="cart-passenger-row">
          <span>Trẻ em:</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '18px', textAlign: 'center', fontWeight: 700 }}>{qtyChild}</span>
            <div className="d-flex flex-column">
              <button
                className="cart-qty-btn"
                style={{ marginBottom: '2px', height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => onUpdateQuantity(item._id, { quantity_child: qtyChild + 1 })}
                disabled={actionLoading || !canAddPassenger}
                title="Tăng số lượng trẻ em"
              >&#9650;</button>
              <button
                className="cart-qty-btn"
                style={{ height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => {
                  if (qtyChild > 0) onUpdateQuantity(item._id, { quantity_child: qtyChild - 1 });
                }}
                disabled={actionLoading || qtyChild <= 0}
                title="Giảm số lượng trẻ em"
              >&#9660;</button>
            </div>
          </div>
          <span className="cart-passenger-price">
            {qtyChild} x {childPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Em bé */}
        <div className="cart-passenger-row">
          <span>Em bé:</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '18px', textAlign: 'center', fontWeight: 700 }}>{qtyBaby}</span>
            <div className="d-flex flex-column">
              <button
                className="cart-qty-btn"
                style={{ marginBottom: '2px', height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => onUpdateQuantity(item._id, { quantity_baby: qtyBaby + 1 })}
                disabled={actionLoading || !canAddPassenger}
                title="Tăng số lượng em bé"
              >&#9650;</button>
              <button
                className="cart-qty-btn"
                style={{ height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => {
                  if (qtyBaby > 0) onUpdateQuantity(item._id, { quantity_baby: qtyBaby - 1 });
                }}
                disabled={actionLoading || qtyBaby <= 0}
                title="Giảm số lượng em bé"
              >&#9660;</button>
            </div>
          </div>
          <span className="cart-passenger-price">
            {qtyBaby} x {babyPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
