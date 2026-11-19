import React, { useState, useEffect } from 'react';
import { X, Check, UserCheck, Heart } from 'lucide-react';
import { getAlbumPhotos, assignPhotoToCustomers, removePhotoAssignment } from '../souvenirAdminService';

function AssignPhotoModal({ customer, albumId, onClose, onUpdated }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await getAlbumPhotos(albumId, { limit: 100 });
      if (res?.success) {
        setPhotos(res.data.photos || []);
      }
    } catch (err) {
      console.error('Không thể tải ảnh album:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) fetchPhotos();
  }, [albumId]);

  const isAssigned = (photo) => {
    return (photo.assigned_customers || []).some(
      (c) => c.booking_customer_id?.toString() === customer.booking_customer_id?.toString()
    );
  };

  const handleToggleAssign = async (photo) => {
    const assigned = isAssigned(photo);
    setProcessingId(photo._id);

    try {
      if (assigned) {
        // Gỡ gắn
        await removePhotoAssignment(photo._id, customer.booking_customer_id);
      } else {
        // Gắn vào khách
        await assignPhotoToCustomers(photo._id, [
          {
            order_id: customer.order_id,
            order_item_id: customer.order_item_id,
            booking_customer_id: customer.booking_customer_id,
          },
        ]);
      }
      await fetchPhotos();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi thao tác gắn ảnh');
    } finally {
      setProcessingId(null);
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
          maxWidth: '720px',
          maxHeight: '85vh',
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
            <UserCheck size={20} color="#7c3aed" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.063rem', fontWeight: 600, color: '#1e293b' }}>
                Gắn Ảnh Riêng Cho: {customer.full_name}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Nhấn vào từng ảnh để Gắn hoặc Bỏ gắn cho khách hàng này (Ảnh riêng chỉ khách này xem được)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Đang tải danh sách ảnh...
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Album chưa có ảnh nào. Vui lòng tải ảnh lên trước.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              {photos.map((p) => {
                const assigned = isAssigned(p);
                const isBusy = processingId === p._id;

                return (
                  <div
                    key={p._id}
                    onClick={() => !isBusy && handleToggleAssign(p)}
                    style={{
                      position: 'relative',
                      height: '130px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: isBusy ? 'wait' : 'pointer',
                      border: assigned ? '3px solid #7c3aed' : '1px solid #cbd5e1',
                      boxShadow: assigned ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <img
                      src={p.thumbnail_url || p.url}
                      alt={p.caption || 'Photo'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: assigned ? 1 : 0.7,
                      }}
                    />

                    {/* Badge trạng thái */}
                    {assigned && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: '#7c3aed',
                          color: '#fff',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        insetInline: 0,
                        padding: '4px 6px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '0.688rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.caption || p.category}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignPhotoModal;

