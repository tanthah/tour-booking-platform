import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, History, Search, RefreshCw, ToggleLeft, ToggleRight, Ticket, BarChart3, FileText } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import CouponUsagesModal from '../components/CouponUsagesModal';
import CouponReportModal from '../components/CouponReportModal';

const API_URL = '/coupons/admin';

function Coupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCouponForUsage, setSelectedCouponForUsage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllUsagesModal, setShowAllUsagesModal] = useState(false);

  const fetchCoupons = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await axiosAdmin.get(API_URL, { params });
      const data = res?.data || res;
      setCoupons(data.coupons || []);
      setPagination(data.pagination || { page, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Lỗi khi tải coupons:', error);
      alert('Không thể tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchCoupons(1);
  }, [fetchCoupons]);

  const handleToggleStatus = async (coupon) => {
    const nextStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axiosAdmin.patch(`${API_URL}/${coupon._id}/status`, { status: nextStatus });
      fetchCoupons(pagination.page);
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa coupon này?')) return;
    try {
      await axiosAdmin.delete(`${API_URL}/${id}`);
      fetchCoupons(pagination.page);
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa coupon');
    }
  };

  const isExpired = (endAt) => new Date() > new Date(endAt);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ticket size={24} color="var(--primary-color)" /> Quản lý Mã giảm giá (Coupon)
        </h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowReportModal(true)} title="Xem báo cáo chiến dịch">
            <BarChart3 size={17} />
            <span>Báo Cáo</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAllUsagesModal(true)} title="Xem toàn bộ lịch sử sử dụng">
            <FileText size={17} />
            <span>Lịch Sử Dùng</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/coupons/create')}>
            <Plus size={18} />
            <span>Thêm Coupon</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCoupons(1)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt (ACTIVE)</option>
            <option value="INACTIVE">Tạm tắt (INACTIVE)</option>
          </select>

          <button className="btn btn-secondary" onClick={() => fetchCoupons(1)} title="Làm mới">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách coupon...</p>
        ) : coupons.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Chưa có mã giảm giá nào.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Coupon</th>
                  <th>Mức giảm</th>
                  <th>Đơn tối thiểu</th>
                  <th>Lượt sử dụng</th>
                  <th>Mỗi khách</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = isExpired(c.end_at);
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px' }}>
                            {c.code}
                          </span>
                          {c.user_target === 'NEW_USER' && (
                            <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              Khách mới
                            </span>
                          )}
                          {c.applies_to === 'CATEGORY' && (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '10px', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              {c.applicable_categories?.includes('DOMESTIC') ? 'Trong nước' : 'Nước ngoài'}
                            </span>
                          )}
                          {c.applies_to === 'SEASON' && (
                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              Mùa {c.applicable_seasons?.join('/')}
                            </span>
                          )}
                          {c.is_batch && (
                            <span style={{ background: '#f3e8ff', color: '#6b21a8', fontSize: '10px', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              Lô {c.batch_id?.slice(-4)}
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxWidth: '200px' }}>
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#16a34a' }}>{c.discount_percent}%</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {c.max_discount_amount ? `Tối đa ${c.max_discount_amount.toLocaleString('vi-VN')} đ` : 'Không giới hạn max'}
                        </div>
                      </td>
                      <td>
                        {c.min_order_amount ? `${c.min_order_amount.toLocaleString('vi-VN')} đ` : 'Không yêu cầu'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{c.used_count}</span>
                        <span style={{ color: '#64748b' }}> / {c.usage_limit ?? '∞'}</span>
                      </td>
                      <td>{c.per_user_limit} lần</td>
                      <td style={{ fontSize: '12px' }}>
                        <div>{new Date(c.start_at).toLocaleDateString('vi-VN')}</div>
                        <div>→ {new Date(c.end_at).toLocaleDateString('vi-VN')}</div>
                        {expired && (
                          <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            HẾT HẠN
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: c.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: c.status === 'ACTIVE' ? '#166534' : '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                          {c.status === 'ACTIVE' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          <span>{c.status}</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedCouponForUsage(c)}
                            title="Xem lịch sử sử dụng"
                            style={{ padding: '6px' }}
                          >
                            <History size={15} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => navigate(`/admin/coupons/edit/${c._id}`)}
                            title="Sửa thông tin"
                            style={{ padding: '6px' }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(c._id)}
                            title="Xóa coupon"
                            style={{ padding: '6px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchCoupons(pagination.page - 1)}
            >
              Trang trước
            </button>
            <span style={{ alignSelf: 'center', fontSize: '13px', color: '#64748b' }}>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchCoupons(pagination.page + 1)}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      {selectedCouponForUsage && (
        <CouponUsagesModal
          coupon={selectedCouponForUsage}
          onClose={() => setSelectedCouponForUsage(null)}
        />
      )}

      {showAllUsagesModal && (
        <CouponUsagesModal
          coupon={null}
          onClose={() => setShowAllUsagesModal(false)}
        />
      )}

      {showReportModal && (
        <CouponReportModal
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export default Coupons;
