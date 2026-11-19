import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminDataTable,
} from '../../../components/common';
import {
  getPendingReviews,
  approveCard,
  requestRevision,
  publishCard,
} from '../souvenirAdminService';
import CardPreviewModal from '../components/CardPreviewModal';

function SouvenirReviewQueue() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [error, setError] = useState(null);

  const [previewCardId, setPreviewCardId] = useState(null);
  const [revisionModalCard, setRevisionModalCard] = useState(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingCards = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPendingReviews({ page, limit: pagination.limit });
      if (res?.success) {
        setCards(res.data.cards || []);
        setPagination({
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.total_pages,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách thiệp chờ duyệt');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchPendingCards(1);
  }, [fetchPendingCards]);

  const handleApprove = async (cardId) => {
    if (!window.confirm('Xác nhận duyệt thiệp này?')) return;
    try {
      setActionLoading(true);
      const res = await approveCard(cardId, 'Admin duyệt đạt yêu cầu');
      if (res?.success) {
        alert('Đã duyệt thiệp thành công! Bạn có thể phát hành thiệp ngay bây giờ.');
        fetchPendingCards(pagination.page);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi duyệt thiệp');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!revisionReason.trim()) return alert('Vui lòng nhập lý do yêu cầu chỉnh sửa');

    try {
      setActionLoading(true);
      const res = await requestRevision(revisionModalCard._id, revisionReason.trim());
      if (res?.success) {
        alert('Đã gửi yêu cầu chỉnh sửa về cho nhân viên phụ trách!');
        setRevisionModalCard(null);
        setRevisionReason('');
        fetchPendingCards(pagination.page);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi yêu cầu chỉnh sửa');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (cardId) => {
    if (!window.confirm('Phát hành thiệp này ngay cho khách hàng và kích hoạt gửi email?')) return;
    try {
      setActionLoading(true);
      const res = await publishCard(cardId);
      if (res?.success) {
        alert('Đã phát hành thiệp thành công!');
        fetchPendingCards(pagination.page);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi phát hành thiệp');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'tour_album',
      title: 'Đợt khởi hành / Album',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>
            {row.album_id?.title || 'Album chuyến đi'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Người gửi: <strong>{row.submitted_by?.full_name || 'Nhân viên'}</strong> (
            {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('vi-VN') : ''})
          </div>
        </div>
      ),
    },
    {
      key: 'recipient',
      title: 'Khách hàng nhận thiệp',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.recipient_name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Email: {row.recipient_email || 'Không có'}
          </div>
        </div>
      ),
    },
    {
      key: 'preview_content',
      title: 'Nội dung & Lời nhắn',
      render: (row) => (
        <div style={{ maxWidth: '300px', fontSize: '0.813rem', color: '#475569' }}>
          <div style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{row.personal_message || row.greeting_message || 'Lời chúc mặc định'}"
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Ảnh riêng đã gắn: {row.personal_photo_ids?.length || 0} ảnh
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '320px',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPreviewCardId(row._id)}
            style={{ fontSize: '0.75rem', padding: '5px 10px' }}
          >
            <Eye size={14} /> Xem
          </button>

          <button
            className="btn btn-sm"
            onClick={() => {
              setRevisionModalCard(row);
              setRevisionReason('');
            }}
            disabled={actionLoading}
            style={{
              fontSize: '0.75rem',
              padding: '5px 10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <XCircle size={14} /> Yêu cầu sửa
          </button>

          <button
            className="btn btn-sm"
            onClick={() => handleApprove(row._id)}
            disabled={actionLoading}
            style={{
              fontSize: '0.75rem',
              padding: '5px 10px',
              backgroundColor: '#dbeafe',
              color: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <CheckCircle size={14} /> Duyệt
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page-container">
      <AdminPageHeader
        title="Hộp Duyệt Thiệp Điện Tử (Admin)"
        subtitle="Kiểm tra nội dung, ảnh cá nhân và quyền sử dụng hình ảnh trước khi phát hành cho khách hàng"
        actions={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => fetchPendingCards(pagination.page)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Làm mới
          </button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={cards}
        loading={loading}
        error={error}
        emptyText="Hiện tại không có thiệp nào đang chờ duyệt."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchPendingCards(p)}
        rowKey="_id"
      />

      {/* Preview Modal */}
      {previewCardId && (
        <CardPreviewModal cardId={previewCardId} onClose={() => setPreviewCardId(null)} />
      )}

      {/* Revision Reason Modal */}
      {revisionModalCard && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1060,
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
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
              Yêu Cầu Chỉnh Sửa Thiệp
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 16px' }}>
              Khách nhận: <strong>{revisionModalCard.recipient_name}</strong>. Vui lòng ghi rõ lý do để nhân viên phụ trách cập nhật lại.
            </p>

            <form onSubmit={handleRequestRevisionSubmit}>
              <textarea
                rows={4}
                required
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Ví dụ: Ảnh bìa chưa rõ nét, vui lòng đổi sang ảnh chụp tập thể tại điểm A..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRevisionModalCard(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Đang gửi...' : 'Xác nhận yêu cầu sửa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SouvenirReviewQueue;

