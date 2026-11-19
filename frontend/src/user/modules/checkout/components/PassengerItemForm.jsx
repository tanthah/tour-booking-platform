import { Row, Col, Form } from 'react-bootstrap';

/**
 * PassengerItemForm Component - Nhập thông tin cho một hành khách đi tour
 * - Duy nhất Khách 1 có thể chọn dùng thông tin người đặt hoặc nhập thông tin mới
 * - Các khách 2, 3, 4, ... mặc định nhập thông tin riêng
 * - Ràng buộc và hiển thị thông báo lỗi chi tiết
 */
const PassengerItemForm = ({
  passenger,
  index,
  itemTitle,
  useBookerInfo = false,
  onToggleBookerInfo,
  onChange,
  errors = {},
}) => {
  const isPassengerOne = index === 0;
  const isAdult = passenger.passenger_type === 'ADULT' || !passenger.passenger_type;
  const isChild = passenger.passenger_type === 'CHILD';
  const isBaby = passenger.passenger_type === 'BABY';

  const typeBadgeText = passenger.type_label || (isChild ? 'Trẻ em' : isBaby ? 'Em bé' : 'Người lớn');
  const typeBadgeStyle = isBaby
    ? { background: '#fef3c7', color: '#92400e' }
    : isChild
    ? { background: '#e0f2fe', color: '#0369a1' }
    : { background: '#f1f5f9', color: '#334155' };

  return (
    <div
      className="checkout-passenger-box"
      style={{
        border: isPassengerOne && useBookerInfo ? '2px solid #ea580c' : undefined,
        background: isPassengerOne && useBookerInfo ? '#fffbf5' : undefined,
      }}
    >
      <div className="checkout-passenger-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#1e293b' }}>
            Hành khách {index + 1}
          </span>
          <span
            className="badge"
            style={{ ...typeBadgeStyle, fontSize: '11.5px', padding: '4px 8px', borderRadius: '6px' }}
          >
            {typeBadgeText}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            ({itemTitle})
          </span>
        </div>

        {/* Chỉ duy nhất Khách 1 có thể chọn dùng thông tin người đặt hoặc nhập thông tin mới */}
        {isPassengerOne && (
          <div>
            {useBookerInfo ? (
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  ✓ Đang dùng thông tin người đặt
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '6px' }}
                  onClick={() => onToggleBookerInfo(false)}
                  title="Nhập thông tin riêng cho hành khách này"
                >
                  Nhập thông tin mới
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="checkout-copy-btn"
                onClick={() => onToggleBookerInfo(true)}
                title="Tự động điền theo thông tin người đặt"
              >
                Sử dụng thông tin người đặt
              </button>
            )}
          </div>
        )}
      </div>

      <Row className="g-3 mt-1">
        {/* Họ và tên */}
        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13px', fontWeight: 600 }}>
              Họ và tên <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="VD: Nguyễn Văn A"
              value={passenger.full_name || ''}
              onChange={(e) => onChange(index, 'full_name', e.target.value)}
              isInvalid={!!errors.full_name}
              style={{ borderRadius: '8px', fontSize: '13.5px' }}
            />
            {errors.full_name && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.full_name}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        {/* Số điện thoại */}
        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13px', fontWeight: 600 }}>
              Số điện thoại {isAdult && <span className="text-danger">*</span>}
              {!isAdult && <span style={{ fontSize: '11px', color: '#64748b' }}> (tùy chọn)</span>}
            </Form.Label>
            <Form.Control
              type="tel"
              placeholder={isAdult ? 'VD: 0912345678' : 'Dùng SĐT người liên hệ nếu chưa có'}
              value={passenger.phone || ''}
              onChange={(e) => onChange(index, 'phone', e.target.value)}
              isInvalid={!!errors.phone}
              style={{ borderRadius: '8px', fontSize: '13.5px' }}
            />
            {errors.phone && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.phone}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        {/* Giới tính */}
        <Col md={4}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13px', fontWeight: 600 }}>
              Giới tính <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={passenger.gender || ''}
              onChange={(e) => onChange(index, 'gender', e.target.value)}
              isInvalid={!!errors.gender}
              style={{ borderRadius: '8px', fontSize: '13.5px' }}
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </Form.Select>
            {errors.gender && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.gender}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        {/* Ngày sinh */}
        <Col md={4}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13px', fontWeight: 600 }}>
              Ngày sinh <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              value={passenger.date_of_birth || ''}
              onChange={(e) => onChange(index, 'date_of_birth', e.target.value)}
              isInvalid={!!errors.date_of_birth}
              style={{ borderRadius: '8px', fontSize: '13.5px' }}
            />
            {errors.date_of_birth && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.date_of_birth}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        {/* Số CCCD / CMND */}
        <Col md={4}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13px', fontWeight: 600 }}>
              Số CCCD / CMND {isAdult && <span className="text-danger">*</span>}
              {!isAdult && <span style={{ fontSize: '11px', color: '#64748b' }}> (mã định danh)</span>}
            </Form.Label>
            <Form.Control
              type="text"
              placeholder={isAdult ? 'VD: 079...' : 'Mã định danh (nếu có)'}
              value={passenger.id_number || ''}
              onChange={(e) => onChange(index, 'id_number', e.target.value)}
              isInvalid={!!errors.id_number}
              style={{ borderRadius: '8px', fontSize: '13.5px' }}
            />
            {errors.id_number && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.id_number}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default PassengerItemForm;
