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
  
  const priceVal = typeof tour.price === 'number' ? tour.price : 0;
  const originalPriceVal = typeof tour.original_price === 'number' ? tour.original_price : 0;
  
  const priceDisplay = priceVal > 0 ? `${priceVal.toLocaleString('vi-VN')} đ` : (tour.price || 'Liên hệ');
  const oldPriceDisplay = originalPriceVal > priceVal ? `${originalPriceVal.toLocaleString('vi-VN')} đ` : (tour.oldPrice || '');

  // Tính phần trăm giảm giá nếu có
  let discountDisplay = tour.discount || '';
  if (!discountDisplay && originalPriceVal > priceVal && originalPriceVal > 0) {
    const percent = Math.round(((originalPriceVal - priceVal) / originalPriceVal) * 100);
    discountDisplay = `-${percent}%`;
  }

  const code = tour.code || '';
  const departureDateDisplay = tour.departure_date
    ? new Date(tour.departure_date).toLocaleDateString('vi-VN')
    : (tour.departure || '');
  const duration = tour.duration || '';
  const rating = tour.rating || 5;
  const slots = tour.remaining_slots !== undefined ? tour.remaining_slots : (tour.slots ?? 0);

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
            <span className="tour-card-slots">{slots}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;

