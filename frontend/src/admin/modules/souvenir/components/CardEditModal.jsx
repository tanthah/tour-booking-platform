import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Image as ImageIcon } from 'lucide-react';
import { updateCard, getAlbumPhotos } from '../souvenirAdminService';

function CardEditModal({ card, albumId, onClose, onSuccess }) {
  const [personalMessage, setPersonalMessage] = useState(card?.personal_message || '');
  const [greetingMessage, setGreetingMessage] = useState(card?.greeting_message || '');
  const [recipientEmail, setRecipientEmail] = useState(card?.recipient_email || '');
  const [selectedCover, setSelectedCover] = useState(card?.cover_photo || null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!albumId) return;
    const loadPhotos = async () => {
      try {
        setLoadingPhotos(true);
        const res = await getAlbumPhotos(albumId, { limit: 50 });
        if (res?.success) {
          setAlbumPhotos(res.data.photos || []);
        }
      } catch (err) {
        console.error('Không thể tải ảnh album:', err);
      } finally {
        setLoadingPhotos(false);
      }
    };
    loadPhotos();
  }, [albumId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = {
        personal_message: personalMessage,
        greeting_message: greetingMessage,
        recipient_email: recipientEmail,
      };
      if (selectedCover) {
        payload.cover_photo = {
          url: selectedCover.url,
          public_id: selectedCover.public_id,
          thumbnail_url: selectedCover.thumbnail_url || selectedCover.url,
        };
      }
      const res = await updateCard(card._id, payload);
      if (res?.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật thiệp');
    } finally {
      setSaving(false);
    }
  };

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
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.063rem', fontWeight: 600, color: '#1e293b' }}>
              Biên Tập Thiệp: {card.recipient_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Chọn ảnh bìa */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '8px', color: '#334155' }}>
              Ảnh bìa thiệp
            </label>
            {loadingPhotos ? (
              <div style={{ fontSize: '0.813rem', color: '#94a3b8' }}>Đang tải danh sách ảnh...</div>
            ) : albumPhotos.length === 0 ? (
              <div style={{ fontSize: '0.813rem', color: '#94a3b8' }}>Chưa có ảnh trong album để chọn bìa</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '8px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  padding: '6px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                {albumPhotos.map((p) => {
                  const isSelected = selectedCover?.public_id === p.public_id;
                  return (
                    <div
                      key={p._id}
                      onClick={() => setSelectedCover(p)}
                      style={{
                        height: '70px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '3px solid #2563eb' : '1px solid #cbd5e1',
                        opacity: isSelected ? 1 : 0.75,
                        transition: 'all 0.15s',
                      }}
                    >
                      <img src={p.thumbnail_url || p.url} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email người nhận */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', color: '#334155' }}>
              Email nhận thông báo thiệp
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="nhanvien@example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Lời cảm ơn chung */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', color: '#334155' }}>
              Lời cảm ơn (Lời chúc chung)
            </label>
            <textarea
              rows={4}
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Lời nhắn riêng */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', color: '#334155' }}>
              Lời nhắn riêng của đoàn (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Thêm lời chúc ấm áp riêng cho khách hàng này..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CardEditModal;

