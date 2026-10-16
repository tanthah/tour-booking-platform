import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

const usageStatusBadge = (status) => {
  const map = {
    RESERVED: { bg: '#fef3c7', color: '#92400e', text: 'Đang giữ chỗ' },
    USED: { bg: '#dcfce7', color: '#166534', text: 'Đã thanh toán' },
    RELEASED: { bg: '#fee2e2', color: '#991b1b', text: 'Đã giải phóng' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', text: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
      {s.text}
    </span>
  );
};

function CouponUsagesModal({ coupon, onClose }) {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchUsages = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get(`/coupons/admin/${coupon._id}/usages`, {
        params: { page, limit: 10 },
      });
      const data = res?.data || res;
      setUsages(data.usages || []);
      setPagination(data.pagination || { page, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      alert(err.message || 'Lỗi khi tải lịch sử sử dụng');
    } finally {
      setLoading(false);
    }
  }, [coupon._id]);

  useEffect(() => {
    fetchUsages(1);
  }, [fetchUsages]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Lịch sử sử dụng mã: <span style={{ color: '#2563eb' }}>{coupon.code}</span>
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Đã dùng: <strong>{coupon.used_count}</strong> {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'lượt'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>Đang tải lịch sử...</p>
          ) : usages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>Chưa có lượt sử dụng nào cho mã này.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Mã đơn</th>
                    <th>Số tiền giảm</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {usages.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.user_id?.full_name || 'Khách'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{u.user_id?.email || ''}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {u.booking_id?.order_code || u.booking_id?._id || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>
                        -{(u.discount_amount || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td>{usageStatusBadge(u.status)}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(u.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsages(pagination.page - 1)}
            >
              Trang trước
            </button>
            <span style={{ alignSelf: 'center', fontSize: '13px', color: '#64748b' }}>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsages(pagination.page + 1)}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CouponUsagesModal;
