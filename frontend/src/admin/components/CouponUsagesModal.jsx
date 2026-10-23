import { useState, useEffect, useCallback } from 'react';
import { X, Download, Filter } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchUsages = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const url = coupon ? `/coupons/admin/${coupon._id}/usages` : '/coupons/admin/usages/all';
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await axiosAdmin.get(url, { params });
      const data = res?.data || res;
      setUsages(data.usages || []);
      setPagination(data.pagination || { page, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      alert(err.message || 'Lỗi khi tải lịch sử sử dụng');
    } finally {
      setLoading(false);
    }
  }, [coupon, statusFilter]);

  useEffect(() => {
    fetchUsages(1);
  }, [fetchUsages]);

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (coupon) params.coupon_id = coupon._id;
      if (statusFilter) params.status = statusFilter;

      const res = await axiosAdmin.get('/coupons/admin/usages/export', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data || res], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `coupon_usages_${coupon ? coupon.code : 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.message || 'Không thể xuất file CSV');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '820px', width: '100%', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header Modal */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {coupon ? (
                <>Lịch sử mã: <span style={{ color: '#2563eb' }}>{coupon.code}</span></>
              ) : (
                'Toàn bộ Lịch sử Sử dụng Coupon'
              )}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
              Tổng cộng {pagination.total} lượt áp dụng mã trong hệ thống
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Bộ lọc trạng thái & Nút xuất CSV */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#64748b" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="USED">Đã thanh toán (USED)</option>
              <option value="RESERVED">Đang giữ chỗ (RESERVED)</option>
              <option value="RELEASED">Đã giải phóng (RELEASED)</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <Download size={14} /> Xuất file CSV
          </button>
        </div>

        {/* Bảng dữ liệu */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>Đang tải lịch sử...</p>
          ) : usages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>Chưa có lượt sử dụng nào thỏa mãn bộ lọc.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    {!coupon && <th>Mã Coupon</th>}
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
                      {!coupon && (
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                            {u.coupon_id?.code || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.user_id?.full_name || 'Khách vãng lai'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{u.user_id?.phone || u.user_id?.email || ''}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {u.booking_id?.order_code || u.booking_id?._id?.slice(-8) || 'N/A'}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: '#f8fafc' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsages(pagination.page - 1)}
            >
              Trang trước
            </button>
            <span style={{ alignSelf: 'center', fontSize: '12.5px', color: '#64748b' }}>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
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
