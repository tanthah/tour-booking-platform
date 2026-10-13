import { Link } from 'react-router-dom';

/**
 * TourCard Component - Thẻ hiển thị sản phẩm Tour chuẩn thiết kế
 * Bao gồm:
 * - Ảnh đại diện kèm dải badge  GIẢM -30%"
 * - Tiêu đề Tour du lịch có link chuyển trang chi tiết
 * - Giá gốc gạch ngang và giá khuyến mãi màu đỏ đậm
 * - Mã Tour, Ngày khởi hành, Thời gian diễn ra
 * - Đánh giá sao  và số lượng chỗ còn trống
 */
const TourCard = ({ tour }) => {
  const {
    id = '1',
    image,
    title,
    oldPrice = '13.650.000đ',
    price = '2.590.000 đ',
    code = '123456789',
    departure = '22/07/2024',
    duration = '10 Ngày 9 Đêm',
    rating = 5,
    slots = 10,
    discount = '-30%',
  } = tour;

  const detailUrl = `/tour/${id}`;

  return (
    <div className="tour-card-item">
      {/* Hình ảnh Tour kèm nhãn khuyến mãi và Link xem chi tiết */}
      <Link to={detailUrl} style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', height: '170px' }}>
        <img
          src={image}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          loading="lazy"
        />
        <div className="tour-card-badge-sale">
          <span>⚡ GIẢM {discount}</span>
        </div>
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
          <span className="tour-card-price-old">{oldPrice}</span>
          <span className="tour-card-price-new">{price}</span>
        </div>

        {/* Thông số metadata */}
        <div className="mb-2">
          <div className="tour-card-meta">
            Mã Tour: <strong className="text-dark">{code}</strong>
          </div>
          <div className="tour-card-meta">
            Ngày Khởi Hành: <span>{departure}</span>
          </div>
          <div className="tour-card-meta">
            Thời Gian: <strong>{duration}</strong>
          </div>
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
