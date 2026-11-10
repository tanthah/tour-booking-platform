import { Link } from 'react-router-dom';

/**
 * TourCard Component - Thẻ hiển thị sản phẩm Tour chuẩn thiết kế
 * Dữ liệu được truyền từ API backend Tour model
 */
const TourCard = ({ tour = {} }) => {
  const tourId = tour._id || tour.id || '';
  const title = tour.title || 'Chưa cập nhật tên tour';
  const image =
    tour.main_image ||
    tour.image ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop';
  
  // 1. Lấy giá bán hiện tại: ưu tiên sale_price từ backend, fallback sang price hoặc original_price
  const currentPrice = typeof tour.sale_price === 'number'
    ? tour.sale_price
    : (typeof tour.price === 'number'
      ? tour.price
      : (typeof tour.original_price === 'number' ? tour.original_price : 0));

  // 2. Lấy giá gốc: từ original_price hoặc oldPrice
  const originalPrice = typeof tour.original_price === 'number'
    ? tour.original_price
    : (typeof tour.oldPrice === 'number' ? tour.oldPrice : 0);

  // 3. Phần trăm giảm giá được cấu hình từ Tour
  const discountPercent = typeof tour.discount_percent === 'number' ? tour.discount_percent : 0;

  // 4. Chỉ coi là CÓ GIẢM GIÁ khi:
  // - discount_percent > 0 và currentPrice < originalPrice
  // HOẶC originalPrice > currentPrice và currentPrice > 0
  const hasDiscount = (discountPercent > 0 && currentPrice < originalPrice) ||
    (originalPrice > currentPrice && currentPrice > 0);

  // 5. Chuỗi hiển thị giá bán chính: chữ màu đỏ nổi bật, không gạch ngang
  const priceDisplay = currentPrice > 0
    ? `${currentPrice.toLocaleString('vi-VN')} đ`
    : (typeof tour.price === 'string' && tour.price ? tour.price : 'Liên hệ');

  // 6. Giá cũ gạch ngang: CHỈ HIỂN THỊ KHI CÓ GIẢM GIÁ THẬT
  const oldPriceDisplay = hasDiscount && originalPrice > 0
    ? `${originalPrice.toLocaleString('vi-VN')} đ`
    : '';

  // 7. Huy hiệu giảm giá (⚡ GIẢM -X%): CHỈ HIỂN THỊ KHI CÓ GIẢM GIÁ THẬT
  let discountDisplay = '';
  if (hasDiscount) {
    if (tour.discount) {
      discountDisplay = tour.discount.startsWith('-') ? tour.discount : `-${tour.discount}`;
    } else if (discountPercent > 0) {
      discountDisplay = `-${discountPercent}%`;
    } else if (originalPrice > 0) {
      const percent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      if (percent > 0) {
        discountDisplay = `-${percent}%`;
      }
    }
  }

  const code = tour.code || '';
  const departureDateDisplay = tour.departure_date
    ? new Date(tour.departure_date).toLocaleDateString('vi-VN')
    : (tour.departure || '');
  const duration = tour.duration || '';
  const rating = tour.rating || 5;

  // Số chỗ còn lại
  const hasSlotsInfo = typeof tour.remaining_slots === 'number' || typeof tour.slots === 'number';
  const slots = hasSlotsInfo ? (tour.remaining_slots ?? tour.slots) : null;

  const detailUrl = tourId ? `/tour/${tourId}` : '#';

  return (
    <div className="tour-card-item">
      {/* Hình ảnh Tour kèm nhãn khuyến mãi và Link xem chi tiết */}
      <Link
        to={detailUrl}
        style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', height: '170px' }}
      >
        <img
          src={image}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          loading="lazy"
        />
        {discountDisplay && (
          <div className="tour-card-badge-sale">
            <span>⚡ GIẢM {discountDisplay}</span>
          </div>
        )}
      </Link>

      {/* Nội dung chi tiết Tour */}
      <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link to={detailUrl} style={{ textDecoration: 'none' }}>
          <h4 className="tour-card-title" title={title}>
            {title}
          </h4>
        </Link>

        {/* Khối giá tiền */}
        <div className="d-flex align-items-baseline gap-2 mb-2">
          {oldPriceDisplay && <span className="tour-card-price-old">{oldPriceDisplay}</span>}
          <span className="tour-card-price-new">{priceDisplay}</span>
        </div>

        {/* Thông số metadata */}
        <div className="mb-2">
          {code && (
            <div className="tour-card-meta">
              Mã Tour: <strong className="text-dark">{code}</strong>
            </div>
          )}
          {departureDateDisplay && (
            <div className="tour-card-meta">
              Ngày Khởi Hành: <span>{departureDateDisplay}</span>
            </div>
          )}
          {duration && (
            <div className="tour-card-meta">
              Thời Gian: <strong>{duration}</strong>
            </div>
          )}
        </div>

        {/* Đánh giá sao và số chỗ còn lại */}
        <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
          <div className="d-flex align-items-center gap-1" style={{ fontSize: '13px' }}>
            <span style={{ color: '#f59e0b' }}>{'★'.repeat(rating)}</span>
            <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>({rating})</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span style={{ fontSize: '11px', color: '#64748b' }}>Số chỗ còn:</span>
            {slots !== null ? (
              <span className={`tour-card-slots ${slots === 0 ? 'bg-secondary' : ''}`}>{slots}</span>
            ) : (
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>Còn chỗ</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;

