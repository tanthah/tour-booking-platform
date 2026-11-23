import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Navigation, ArrowRight, Compass } from 'lucide-react';
import { getMyJourneys } from '../journeyService';
import { JOURNEY_STATUS_META, formatDateTimeVN } from '../journeyConstants';

function UserJourneysList() {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getMyJourneys();
        setJourneys(res?.data || []);
      } catch (err) {
        setError(err?.message || 'Không thể tải danh sách hành trình của bạn.');
      } finally {
        setLoading(false);
      }
    };
    fetchJourneys();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
        <div className="mt-2 text-muted" style={{ fontSize: '14px' }}>Đang tải danh sách hành trình của bạn...</div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (journeys.length === 0) {
    return (
      <Card className="border-0 shadow-sm text-center p-5 rounded-4">
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#fff7ed',
            color: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Compass size={36} />
        </div>
        <h5 className="fw-bold text-dark">Bạn chưa có hành trình tour nào</h5>
        <p className="text-muted mx-auto" style={{ maxWidth: '440px', fontSize: '14px' }}>
          Các đơn đặt tour đã được xác nhận hoặc đặt cọc thành công sẽ tự động hiển thị hành trình theo dõi tại đây.
        </p>
        <div className="mt-3">
          <Button
            as={Link}
            to="/tours"
            style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', fontWeight: 600, padding: '8px 24px', borderRadius: '8px' }}
          >
            Khám phá các tour hấp dẫn
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Row className="g-4">
        {journeys.map((item) => {
          const statusMeta = JOURNEY_STATUS_META[item.status] || JOURNEY_STATUS_META.NOT_STARTED;
          const tour = item.tour_id || {};
          const dep = item.departure_id || {};

          return (
            <Col xs={12} lg={6} key={item._id}>
              <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column" style={{ border: '1px solid #f1f5f9' }}>
                {tour.main_image && (
                  <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={tour.main_image}
                      alt={tour.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      className="position-absolute top-0 end-0 m-2 px-3 py-1 rounded-pill fw-bold"
                      style={{
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.color,
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                )}

                <Card.Body className="d-flex flex-column p-3 p-md-4">
                  <div className="text-muted mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Mã tour: {tour.code} {item.order_info?.order_code ? `• Đơn: ${item.order_info.order_code}` : ''}
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '16px', lineHeight: '1.4' }}>
                    {tour.title}
                  </h5>

                  <div className="d-flex flex-column gap-1 text-muted mb-3" style={{ fontSize: '13px' }}>
                    <div className="d-flex align-items-center gap-2">
                      <Calendar size={14} color="#ea580c" />
                      <span>Khởi hành: {formatDateTimeVN(dep.start_datetime)}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={14} color="#ea580c" />
                      <span className="text-truncate">Điểm hẹn: {dep.meeting_point || 'Đang cập nhật'}</span>
                    </div>
                    {item.guide_id && (
                      <div className="d-flex align-items-center gap-2">
                        <Navigation size={14} color="#ea580c" />
                        <span>HDV: {item.guide_id.full_name} ({item.guide_id.phone})</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '12.5px' }}>
                      <span className="text-muted">Tiến độ ({item.stats?.completed_stops || 0}/{item.stats?.active_stops || 0} điểm)</span>
                      <strong style={{ color: '#0f172a' }}>{item.progress || 0}%</strong>
                    </div>
                    <ProgressBar
                      now={item.progress || 0}
                      variant={item.status === 'COMPLETED' ? 'success' : 'warning'}
                      style={{ height: '8px', borderRadius: '999px' }}
                      className="mb-3"
                    />

                    <Button
                      className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
                      style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', borderRadius: '8px', padding: '9px 16px' }}
                      onClick={() => navigate(`/journey/${item._id}`)}
                    >
                      <span>{item.is_departure_day_reached ? 'Theo dõi hành trình' : 'Xem lịch trình dự kiến'}</span>
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

export default UserJourneysList;
