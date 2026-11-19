import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Sparkles, User, Image as ImageIcon, Heart } from 'lucide-react';
import { previewCard } from '../souvenirAdminService';
import { CARD_STATUS_META } from '../souvenirConstants';

function CardPreviewModal({ cardId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    if (!cardId) return;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await previewCard(cardId);
        if (res?.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Không thể tải xem trước thiệp');
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [cardId]);

  if (!cardId) return null;

  const card = data?.card || {};
  const tour = card.tour_info || {};
  const sharedPhotos = data?.shared_photos || [];
  const personalPhotos = data?.personal_photos || [];
  const statusMeta = CARD_STATUS_META[card.status] || { label: card.status, color: '#64748b' };

  const displayedSharedPhotos =
    activeTab === 'ALL'
      ? sharedPhotos
      : sharedPhotos.filter((p) => p.category === activeTab);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
              Xem Trước Thiệp Điện Tử
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: `${statusMeta.color}15`,
                color: statusMeta.color,
                fontWeight: 600,
              }}
            >
              {statusMeta.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Đang tải giao diện thiệp...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
              {error}
            </div>
          ) : (
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              {/* Card Hero Cover */}
              <div
                style={{
                  position: 'relative',
                  height: '280px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  backgroundColor: '#1e293b',
                  marginBottom: '24px',
                }}
              >
                {card.cover_photo?.url ? (
                  <img
                    src={card.cover_photo.url}
                    alt="Cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                    }}
                  >
                    Chưa chọn ảnh bìa
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '24px',
                    color: '#fff',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      color: '#93c5fd',
                    }}
                  >
                    Kỷ niệm chuyến đi TourGo
                  </span>
                  <h2 style={{ margin: '6px 0 10px', fontSize: '1.5rem', fontWeight: 700 }}>
                    {tour.tour_name || 'Hành Trình Đáng Nhớ'}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.875rem', opacity: 0.9 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} />
                      {tour.departure_date ? new Date(tour.departure_date).toLocaleDateString('vi-VN') : '---'}
                    </span>
                    {tour.meeting_point && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={15} />
                        {tour.meeting_point}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Greeting & Message Section */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <User size={18} color="#2563eb" />
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    Kính gửi: <strong>{card.recipient_name}</strong>
                  </span>
                </div>
                <p
                  style={{
                    color: '#475569',
                    fontSize: '0.938rem',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    margin: '0 0 16px',
                  }}
                >
                  {card.greeting_message}
                </p>

                {card.personal_message && (
                  <div
                    style={{
                      borderLeft: '3px solid #f59e0b',
                      paddingLeft: '14px',
                      backgroundColor: '#fffbeb',
                      padding: '12px 14px',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#b45309', marginBottom: '4px' }}>
                      💬 Lời nhắn riêng từ đoàn:
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#78350f', fontStyle: 'italic' }}>
                      "{card.personal_message}"
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Photos Section (BR05) */}
              {personalPhotos.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Heart size={18} color="#ec4899" fill="#ec4899" />
                    <h4 style={{ margin: 0, fontSize: '1.063rem', fontWeight: 600, color: '#1e293b' }}>
                      Khoảnh Khắc Của Riêng Bạn ({personalPhotos.length})
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {personalPhotos.map((p) => (
                      <div
                        key={p._id}
                        style={{
                          height: '140px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        }}
                      >
                        <img
                          src={p.thumbnail_url || p.url}
                          alt={p.caption || 'Ảnh riêng'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Group Album Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={18} color="#2563eb" />
                    <h4 style={{ margin: 0, fontSize: '1.063rem', fontWeight: 600, color: '#1e293b' }}>
                      Album Ảnh Chung Của Đoàn ({sharedPhotos.length})
                    </h4>
                  </div>

                  {/* Category Filter Pills */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { key: 'ALL', label: 'Tất cả' },
                      { key: 'GROUP', label: 'Tập thể' },
                      { key: 'LOCATION', label: 'Địa điểm' },
                      { key: 'ACTIVITY', label: 'Hoạt động' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          backgroundColor: activeTab === tab.key ? '#2563eb' : '#f1f5f9',
                          color: activeTab === tab.key ? '#fff' : '#64748b',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedSharedPhotos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    Chưa có ảnh nào trong mục này.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {displayedSharedPhotos.map((p) => (
                      <div
                        key={p._id}
                        style={{
                          height: '120px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                        }}
                      >
                        <img
                          src={p.thumbnail_url || p.url}
                          alt={p.caption || 'Ảnh đoàn'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardPreviewModal;

