import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Download,
  Heart,
  Image as ImageIcon,
  Sparkles,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Quote,
  CheckCircle,
} from 'lucide-react';
import {
  getMyCardDetail,
  getMyCardSharedAlbum,
  getPhotoDownload,
  downloadAlbumZip,
} from '../souvenirCustomerService';

function SouvenirCardViewPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState(null);

  // Shared Album state
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxList, setLightboxList] = useState([]);

  // ZIP download state
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Fetch card detail
  useEffect(() => {
    if (!identifier) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMyCardDetail(identifier);
        if (res?.success) {
          setCardData(res.data);
        }
      } catch (err) {
        setError(err?.message || 'Không thể mở thiệp kỷ niệm này.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [identifier]);

  // Fetch shared album
  const fetchAlbum = useCallback(async (category = activeCategory) => {
    if (!identifier) return;
    try {
      setAlbumLoading(true);
      const params = { limit: 100 };
      if (category !== 'ALL') params.category = category;
      const res = await getMyCardSharedAlbum(identifier, params);
      if (res?.success) {
        setSharedPhotos(res.data.photos || []);
      }
    } catch (err) {
      console.error('Lỗi tải album đoàn:', err);
    } finally {
      setAlbumLoading(false);
    }
  }, [identifier, activeCategory]);

  useEffect(() => {
    if (cardData) {
      fetchAlbum(activeCategory);
    }
  }, [cardData, activeCategory, fetchAlbum]);

  // Open Lightbox
  const openLightbox = (photo, list, index) => {
    setLightboxPhoto(photo);
    setLightboxList(list);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxPhoto(null);
    setLightboxList([]);
  };

  const prevPhoto = () => {
    if (lightboxList.length <= 1) return;
    const nextIdx = (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(nextIdx);
    setLightboxPhoto(lightboxList[nextIdx]);
  };

  const nextPhoto = () => {
    if (lightboxList.length <= 1) return;
    const nextIdx = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(nextIdx);
    setLightboxPhoto(lightboxList[nextIdx]);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxPhoto) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, lightboxIndex, lightboxList]);

  // Download 1 photo
  const handleDownloadSingle = async (e, photo) => {
    e.stopPropagation();
    try {
      const res = await getPhotoDownload(photo._id);
      if (res?.success && res.data?.download_url) {
        const a = document.createElement('a');
        a.href = res.data.download_url;
        a.download = res.data.filename || `photo_${photo._id}.jpg`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      alert(err?.message || 'Lỗi khi tải ảnh');
    }
  };

  // Download full album ZIP
  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      await downloadAlbumZip(identifier);
    } catch (err) {
      alert(err?.message || 'Lỗi khi nén tải album ZIP');
    } finally {
      setDownloadingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#ea580c' }} />
        <div className="mt-3 text-muted fw-semibold">Đang chuẩn bị thiệp kỷ niệm của bạn...</div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mx-auto" style={{ maxWidth: '540px' }}>
          <h5>Không thể truy cập thiệp kỷ niệm</h5>
          <p className="mb-3">{error || 'Thiệp không tồn tại hoặc bạn không có quyền xem.'}</p>
          <Button as={Link} to="/ho-so-ca-nhan?tab=souvenirs" variant="outline-danger" size="sm">
            Quay lại danh sách thiệp của tôi
          </Button>
        </Alert>
      </Container>
    );
  }

  const { card, personal_photos, album } = cardData;
  const tour = card.tour_info || {};
  const depDate = tour.departure_date ? new Date(tour.departure_date).toLocaleDateString('vi-VN') : '';

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Top Bar Navigation */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 0',
          position: 'sticky',
          top: '72px',
          zIndex: 100,
        }}
      >
        <Container className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <button
            onClick={() => navigate('/ho-so-ca-nhan?tab=souvenirs')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ea580c',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArrowLeft size={18} /> Danh sách thiệp
          </button>

          {card.allow_download && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              style={{
                color: '#ea580c',
                borderColor: '#ea580c',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
              }}
            >
              <Download size={15} />
              {downloadingZip ? 'Đang nén ZIP...' : 'Tải trọn bộ Album (.ZIP)'}
            </Button>
          )}
        </Container>
      </div>

      <Container className="py-4">
        {/* ============================================================
            1. HERO COVER SECTION (Ảnh Bìa Chuyến Đi)
            ============================================================ */}
        <div
          style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
            backgroundColor: '#0f172a',
            height: '360px',
            marginBottom: '32px',
          }}
        >
          {card.cover_photo?.url ? (
            <img
              src={card.cover_photo.url}
              alt="Cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50">
              <Sparkles size={48} />
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.4) 50%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '32px',
              color: '#fff',
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                style={{
                  backgroundColor: '#ea580c',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                TourGo Souvenir
              </span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Mã tour: {tour.tour_code || 'TOUR'}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, margin: '4px 0 12px' }}>
              {tour.tour_name}
            </h1>

            <div className="d-flex flex-wrap gap-3 text-light" style={{ fontSize: '14px', opacity: 0.9 }}>
              {depDate && (
                <span className="d-inline-flex align-items-center gap-1">
                  <Calendar size={16} color="#fb923c" /> Khởi hành: <strong>{depDate}</strong>
                </span>
              )}
              {tour.meeting_point && (
                <span className="d-inline-flex align-items-center gap-1">
                  <MapPin size={16} color="#fb923c" /> Tập trung: <strong>{tour.meeting_point}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            2. THIỆP TRI ÂN (ELEGANT GREETING CARD)
            ============================================================ */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '24px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
            border: '1px solid #fed7aa',
            padding: '40px 32px',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative Stamp Icon */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              opacity: 0.15,
              pointerEvents: 'none',
            }}
          >
            <Sparkles size={110} color="#ea580c" />
          </div>

          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="text-center mb-4">
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ea580c',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                — THƯ CẢM ƠN & KỶ NIỆM —
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                Kính gửi quý khách {card.recipient_name}
              </h3>
            </div>

            <p
              style={{
                color: '#334155',
                fontSize: '16px',
                lineHeight: 1.85,
                whiteSpace: 'pre-line',
                textAlign: 'justify',
                margin: '0 0 24px',
              }}
            >
              {card.greeting_message}
            </p>

            {/* Lời nhắn riêng của Hướng dẫn viên/Đoàn */}
            {card.personal_message && (
              <div
                style={{
                  backgroundColor: '#fff7ed',
                  borderLeft: '4px solid #ea580c',
                  borderRadius: '0 14px 14px 0',
                  padding: '18px 22px',
                  marginBottom: '28px',
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2 text-warning-emphasis fw-bold" style={{ fontSize: '13px', color: '#c2410c' }}>
                  <Quote size={16} /> LỜI NHẮN THÂN THƯƠNG TỪ ĐOÀN
                </div>
                <div style={{ color: '#9a3412', fontStyle: 'italic', fontSize: '15px', lineHeight: 1.7 }}>
                  "{card.personal_message}"
                </div>
              </div>
            )}

            <div className="text-end pt-3 border-top" style={{ color: '#64748b', fontSize: '13px' }}>
              <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>Đội ngũ TourGo & Hướng dẫn viên</div>
              <div>Trân trọng cảm ơn quý khách!</div>
            </div>
          </div>
        </div>

        {/* ============================================================
            3. ẢNH RIÊNG HÀNH KHÁCH (BR05: KHOẢNH KHẮC CỦA BẠN)
            ============================================================ */}
        {personal_photos && personal_photos.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Heart size={22} color="#ec4899" fill="#ec4899" />
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    Khoảnh Khắc Của Riêng Bạn
                  </h3>
                  <Badge bg="danger" pill style={{ fontSize: '12px' }}>
                    {personal_photos.length} ảnh
                  </Badge>
                </div>
                <p className="text-muted mb-0 mt-1" style={{ fontSize: '13px' }}>
                  Những bức ảnh được chụp và dành riêng cho bạn trong chuyến đi này.
                </p>
              </div>
            </div>

            <Row className="g-3">
              {personal_photos.map((photo, idx) => (
                <Col key={photo._id} xs={6} sm={4} md={3}>
                  <div
                    style={{
                      position: 'relative',
                      height: '180px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#e2e8f0',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onClick={() => openLightbox(photo, personal_photos, idx)}
                  >
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.caption || 'Ảnh riêng'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
                      }}
                    />

                    <button
                      onClick={(e) => handleDownloadSingle(e, photo)}
                      title="Tải ảnh này về máy"
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1e293b',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* ============================================================
            4. ALBUM ẢNH CHUNG CỦA ĐOÀN (BR04: SHARED ALBUM)
            ============================================================ */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <ImageIcon size={22} color="#ea580c" />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  Album Ảnh Chung Của Đoàn
                </h3>
                <Badge bg="secondary" pill style={{ fontSize: '12px' }}>
                  {sharedPhotos.length} ảnh
                </Badge>
              </div>
              <p className="text-muted mb-0 mt-1" style={{ fontSize: '13px' }}>
                Ảnh kỷ niệm tập thể, điểm tham quan và các hoạt động chung của toàn đoàn.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="d-flex gap-2 flex-wrap">
              {[
                { key: 'ALL', label: 'Tất cả ảnh' },
                { key: 'GROUP', label: 'Tập thể đoàn' },
                { key: 'LOCATION', label: 'Địa điểm' },
                { key: 'ACTIVITY', label: 'Hoạt động' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeCategory === tab.key ? '#ea580c' : '#fff',
                    color: activeCategory === tab.key ? '#fff' : '#475569',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {albumLoading ? (
            <div className="text-center py-5 text-muted">Đang tải ảnh album đoàn...</div>
          ) : sharedPhotos.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 text-muted">
              Không có ảnh nào trong nhóm này.
            </div>
          ) : (
            <Row className="g-3">
              {sharedPhotos.map((photo, idx) => (
                <Col key={photo._id} xs={6} sm={4} md={3} lg={2}>
                  <div
                    style={{
                      position: 'relative',
                      height: '150px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#e2e8f0',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onClick={() => openLightbox(photo, sharedPhotos, idx)}
                  >
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.caption || 'Ảnh đoàn'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 35%)',
                      }}
                    />

                    {photo.caption && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '8px',
                          right: '36px',
                          color: '#fff',
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {photo.caption}
                      </div>
                    )}

                    <button
                      onClick={(e) => handleDownloadSingle(e, photo)}
                      title="Tải ảnh này về máy"
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1e293b',
                      }}
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Container>

      {/* ============================================================
          5. LIGHTBOX MODAL (Xem ảnh kích thước lớn)
          ============================================================ */}
      {lightboxPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 15, 29, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '14px', opacity: 0.85 }}>
              {lightboxIndex + 1} / {lightboxList.length}
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={(e) => handleDownloadSingle(e, lightboxPhoto)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <Download size={15} /> Tải ảnh về máy
              </Button>

              <button
                onClick={closeLightbox}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={26} />
              </button>
            </div>
          </div>

          {/* Main Image Display */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 20px',
            }}
          >
            {/* Prev button */}
            {lightboxList.length > 1 && (
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute',
                  left: '20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              src={lightboxPhoto.url}
              alt="Enlarged"
              style={{
                maxWidth: '90vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            />

            {/* Next button */}
            {lightboxList.length > 1 && (
              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute',
                  right: '20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Caption Bottom Bar */}
          {lightboxPhoto.caption && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: '#fff',
                fontSize: '14px',
                backgroundColor: 'rgba(0,0,0,0.4)',
              }}
            >
              {lightboxPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SouvenirCardViewPage;

