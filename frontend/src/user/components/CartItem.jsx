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
              {item.quantity}
            </span>
            <div className="d-flex flex-column">
              <button
                className="cart-qty-btn"
                style={{ marginBottom: '2px', height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                disabled={actionLoading}
              >&#9650;</button>
              <button
                className="cart-qty-btn"
                style={{ height: '16px', width: '20px', fontSize: '10px' }}
                onClick={() => {
                  if (item.quantity > 1) onUpdateQuantity(item._id, item.quantity - 1);
                }}
                disabled={actionLoading || item.quantity <= 1}
              >&#9660;</button>
            </div>
          </div>
          <span className="cart-passenger-price">
            {item.quantity} x {item.price?.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Trẻ em */}
        <div className="cart-passenger-row">
          <span>Trẻ em:</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '18px', textAlign: 'center', fontWeight: 700 }}>0</span>
            <div className="d-flex flex-column">
              <button className="cart-qty-btn"
                style={{ marginBottom: '2px', height: '16px', width: '20px', fontSize: '10px' }}
                disabled>&#9650;</button>
              <button className="cart-qty-btn"
                style={{ height: '16px', width: '20px', fontSize: '10px' }}
                disabled>&#9660;</button>
            </div>
          </div>
          <span className="cart-passenger-price">
            0 x {Math.round((item.price || 0) * 0.7)?.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Em bé */}
        <div className="cart-passenger-row">
          <span>Em bé:</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '18px', textAlign: 'center', fontWeight: 700 }}>0</span>
            <div className="d-flex flex-column">
              <button className="cart-qty-btn"
                style={{ marginBottom: '2px', height: '16px', width: '20px', fontSize: '10px' }}
                disabled>&#9650;</button>
              <button className="cart-qty-btn"
                style={{ height: '16px', width: '20px', fontSize: '10px' }}
                disabled>&#9660;</button>
            </div>
          </div>
          <span className="cart-passenger-price">
            0 x {Math.round((item.price || 0) * 0.3)?.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
