import { useState } from 'react';
import { Card, Badge, Button, ProgressBar } from 'react-bootstrap';

/**
 * CouponCard Component - Thẻ hiển thị thông tin từng mã giảm giá (Voucher)
 * Phong cách vé du lịch hiện đại, màu sắc hài hòa, hỗ trợ sao chép nhanh
 */
const CouponCard = ({ coupon, onCopied, onUseNow }) => {
  const [copied, setCopied] = useState(false);

  const {
    code = '',
    description = '',
    discount_percent = 0,
    max_discount_amount = null,
    min_order_amount = null,
    start_at,
    end_at,
    usage_limit = null,
    used_count = 0,
    user_target = 'ALL',
    applies_to = 'ALL',
    applicable_categories = [],
    applicable_seasons = [],
  } = coupon || {};

  // Sao chép mã vào clipboard
  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (onCopied) onCopied(code);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Không thể sao chép mã:', err);
    }
  };

  // Tính số lượt còn lại
  const remainingUsages = usage_limit !== null ? Math.max(0, usage_limit - used_count) : null;
  const usageRatio = usage_limit ? Math.min(100, Math.round((used_count / usage_limit) * 100)) : null;

  // Format ngày hết hạn
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      className="h-100 shadow-sm border-0 position-relative overflow-hidden"
      style={{
        borderRadius: '16px',
        background: '#ffffff',
        border: '1px solid #fed7aa',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(234, 88, 12, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Ruy-băng / Dải màu cam nổi bật phía trên */}
      <div
        style={{
          height: '6px',
          background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fbbf24 100%)',
        }}
      />

      <Card.Body className="p-3 d-flex flex-column justify-content-between">
        <div>
          {/* Header thẻ: Badge % giảm & Hạn dùng */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <Badge
                bg="danger"
                className="px-2 py-1 fs-6 fw-bold"
                style={{
                  backgroundColor: '#ea580c',
                  borderRadius: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                GIẢM {discount_percent}%
              </Badge>
              {user_target === 'NEW_USER' && (
                <Badge bg="success" style={{ fontSize: '11px', borderRadius: '6px' }}>
                  Khách mới
                </Badge>
              )}
              {applies_to === 'CATEGORY' && (
                <Badge bg="info" text="dark" style={{ fontSize: '11px', borderRadius: '6px' }}>
                  {applicable_categories.includes('DOMESTIC') ? 'Trong nước' : 'Nước ngoài'}
                </Badge>
              )}
              {applies_to === 'SEASON' && (
                <Badge bg="warning" text="dark" style={{ fontSize: '11px', borderRadius: '6px' }}>
                  Mùa {applicable_seasons.join('/')}
                </Badge>
              )}
            </div>

            <span className="text-muted" style={{ fontSize: '12px' }}>
              HSD: {formatDate(end_at)}
            </span>
          </div>

          {/* Hộp hiển thị Mã Code & Nút Copy */}
          <div
            className="d-flex align-items-center justify-content-between p-2 mb-3"
            style={{
              backgroundColor: '#fff7ed',
              borderRadius: '10px',
              border: '1.5px dashed #f97316',
            }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                MÃ GIẢM GIÁ
              </div>
              <div
                className="fw-bold"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  color: '#c2410c',
                  letterSpacing: '1px',
                }}
              >
                {code}
              </div>
            </div>

            <Button
              variant={copied ? 'success' : 'outline-warning'}
              size="sm"
              onClick={handleCopyCode}
              className="fw-bold px-3 py-1"
              style={{
                borderRadius: '8px',
                fontSize: '12px',
                ...(copied
                  ? {}
                  : {
                      borderColor: '#ea580c',
                      color: '#ea580c',
                    }),
              }}
            >
              {copied ? '✓ Đã chép' : 'Sao chép'}
            </Button>
          </div>

          {/* Mô tả coupon */}
          {description && (
            <p
              className="text-dark mb-3"
              style={{
                fontSize: '13px',
                lineHeight: '1.4',
                minHeight: '36px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>
          )}

          {/* Điều kiện áp dụng */}
          <div
            className="p-2 mb-3 rounded-2"
            style={{
              backgroundColor: '#f8fafc',
              fontSize: '12px',
              color: '#475569',
            }}
          >
            <div className="d-flex justify-content-between mb-1">
              <span>Đơn tối thiểu:</span>
              <strong className="text-dark">
                {min_order_amount ? `${min_order_amount.toLocaleString('vi-VN')} đ` : 'Không giới hạn'}
              </strong>
            </div>

            <div className="d-flex justify-content-between">
              <span>Giảm tối đa:</span>
              <strong className="text-dark">
                {max_discount_amount ? `${max_discount_amount.toLocaleString('vi-VN')} đ` : 'Không giới hạn'}
              </strong>
            </div>
          </div>

          {/* Thanh hiển thị tiến độ lượt sử dụng (nếu có giới hạn) */}
          {usage_limit !== null && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '11px' }}>
                <span className="text-muted">Đã dùng: {used_count}/{usage_limit}</span>
                <span className="fw-bold" style={{ color: remainingUsages <= 10 ? '#dc2626' : '#ea580c' }}>
                  Còn {remainingUsages} lượt
                </span>
              </div>
              <ProgressBar
                now={usageRatio}
                style={{ height: '5px', borderRadius: '4px' }}
                variant={usageRatio >= 85 ? 'danger' : 'warning'}
              />
            </div>
          )}
        </div>

        {/* Nút Dùng ngay */}
        <Button
          variant="warning"
          size="sm"
          className="w-100 fw-bold py-2 mt-auto text-white shadow-sm"
          style={{
            backgroundColor: '#ea580c',
            borderColor: '#ea580c',
            borderRadius: '10px',
            fontSize: '13px',
          }}
          onClick={() => {
            handleCopyCode();
            if (onUseNow) onUseNow(code);
          }}
        >
          Lấy mã & Xem tour áp dụng →
        </Button>
      </Card.Body>
    </Card>
  );
};

export default CouponCard;
