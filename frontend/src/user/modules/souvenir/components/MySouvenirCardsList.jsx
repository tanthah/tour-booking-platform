import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Heart, Sparkles, ArrowRight, Camera } from 'lucide-react';
import { getMyCards } from '../souvenirCustomerService';

function MySouvenirCardsList() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMyCards();
        if (res?.success) {
          setCards(res.data.cards || []);
        }
      } catch (err) {
        setError(err?.message || 'Không thể tải danh sách thiệp kỷ niệm.');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
        <div className="mt-2 text-muted" style={{ fontSize: '14px' }}>Đang tải thiệp kỷ niệm của bạn...</div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (cards.length === 0) {
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
          <Sparkles size={36} />
        </div>
        <h5 className="fw-bold text-dark">Bạn chưa có thiệp kỷ niệm nào</h5>
        <p className="text-muted mx-auto" style={{ maxWidth: '440px', fontSize: '14px' }}>
          Sau khi chuyến đi của bạn kết thúc, hướng dẫn viên và ban quản trị TourGo sẽ chuẩn bị album ảnh và thiệp kỷ niệm gửi tặng bạn tại đây!
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
        {cards.map((card) => {
          const depDate = card.departure_date ? new Date(card.departure_date).toLocaleDateString('vi-VN') : '';
          return (
            <Col key={card._id} xs={12} sm={6} lg={4}>
              <Card
                className="h-100 border-0 shadow-sm rounded-4 overflow-hidden"
                style={{
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
                onClick={() => navigate(`/account/souvenirs/${card.public_code}`)}
              >
                {/* Image Cover */}
                <div style={{ position: 'relative', height: '180px', backgroundColor: '#1e293b' }}>
                  {card.cover_photo?.url ? (
                    <img
                      src={card.cover_photo.url}
                      alt={card.tour_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-white-50">
                      <Camera size={32} />
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                    }}
                  />

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    {!card.customer_viewed ? (
                      <span
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        ✨ MỚI
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        ✓ Đã xem
                      </span>
                    )}
                  </div>

                  {card.personal_photo_count > 0 && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(124, 58, 237, 0.9)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Heart size={12} fill="#fff" /> {card.personal_photo_count} ảnh riêng
                      </span>
                    </div>
                  )}

                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', color: '#fff' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} /> {depDate}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <Card.Body className="d-flex flex-column justify-content-between p-3">
                  <div>
                    <h6
                      className="fw-bold text-dark mb-1 text-truncate"
                      title={card.tour_name}
                      style={{ fontSize: '15px' }}
                    >
                      {card.tour_name}
                    </h6>

                    <div className="d-flex align-items-center gap-2 text-muted mt-2" style={{ fontSize: '13px' }}>
                      <User size={14} color="#ea580c" />
                      <span>
                        Dành cho: <strong className="text-dark">{card.recipient_name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: 600 }}>
                      Mở xem thiệp & ảnh
                    </span>
                    <ArrowRight size={16} color="#ea580c" />
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

export default MySouvenirCardsList;

