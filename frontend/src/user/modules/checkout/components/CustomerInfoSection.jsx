import { Row, Col, Form } from 'react-bootstrap';

/**
 * CustomerInfoSection - Form nhập thông tin người đặt tour
 * Hỗ trợ tự động điền và cập nhật ngày sinh, CCCD, giới tính
 */
const CustomerInfoSection = ({ customerInfo, onChange, errors = {} }) => {
  return (
    <div className="checkout-card">
      <h2 className="checkout-card-title">1. Thông Tin Người Đặt Tour</h2>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>
              Họ và tên <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="VD: Nguyễn Văn A"
              value={customerInfo.full_name || ''}
              onChange={(e) => onChange('full_name', e.target.value)}
              isInvalid={!!errors.full_name}
              style={{ borderRadius: '8px' }}
            />
            {errors.full_name && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.full_name}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>
              Số điện thoại <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="tel"
              placeholder="VD: 0912345678"
              value={customerInfo.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
              isInvalid={!!errors.phone}
              style={{ borderRadius: '8px' }}
            />
            {errors.phone && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.phone}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="VD: email@example.com"
              value={customerInfo.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
              isInvalid={!!errors.email}
              style={{ borderRadius: '8px' }}
            />
            {errors.email && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.email}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>Giới tính</Form.Label>
            <Form.Select
              value={customerInfo.gender || 'MALE'}
              onChange={(e) => onChange('gender', e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>Ngày sinh</Form.Label>
            <Form.Control
              type="date"
              value={customerInfo.date_of_birth || ''}
              onChange={(e) => onChange('date_of_birth', e.target.value)}
              isInvalid={!!errors.date_of_birth}
              style={{ borderRadius: '8px' }}
            />
            {errors.date_of_birth && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.date_of_birth}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>Số CCCD / CMND</Form.Label>
            <Form.Control
              type="text"
              placeholder="VD: 079..."
              value={customerInfo.id_number || ''}
              onChange={(e) => onChange('id_number', e.target.value)}
              isInvalid={!!errors.id_number}
              style={{ borderRadius: '8px' }}
            />
            {errors.id_number && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '12px' }}>
                {errors.id_number}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>

        <Col md={12}>
          <Form.Group>
            <Form.Label style={{ fontSize: '13.5px', fontWeight: 600 }}>Ghi chú đặc biệt</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Yêu cầu thêm về phòng, ăn uống, điểm đón..."
              value={customerInfo.note || ''}
              onChange={(e) => onChange('note', e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerInfoSection;
