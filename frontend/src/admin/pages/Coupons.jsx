import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  History,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Ticket,
  BarChart3,
  FileText,
} from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import CouponUsagesModal from '../components/CouponUsagesModal';
import CouponReportModal from '../components/CouponReportModal';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
  ActionButtons,
} from '../components/common';

const API_URL = '/coupons/admin';

function Coupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCouponForUsage, setSelectedCouponForUsage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllUsagesModal, setShowAllUsagesModal] = useState(false);

  const fetchCoupons = useCallback(async (page = 1, limit = pagination.limit || 10) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await axiosAdmin.get(API_URL, { params });
      const data = res?.data || res;
      setCoupons(data.coupons || []);
      setPagination(data.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, pagination.limit]);

  useEffect(() => {
    fetchCoupons(1);
  }, [fetchCoupons]);

  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('');
    fetchCoupons(1);
  };

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
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa coupon');
    }
  };

  const isExpired = (endAt) => new Date() > new Date(endAt);

  const columns = [
    {
      key: 'code',
      title: 'Mã Coupon',
      render: (c) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '13px',
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
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
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'discount',
      title: 'Mức giảm',
      width: '150px',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 700, color: '#16a34a' }}>{c.discount_percent}%</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {c.max_discount_amount ? `Tối đa ${c.max_discount_amount.toLocaleString('vi-VN')} đ` : 'Không giới hạn max'}
          </div>
        </div>
      ),
    },
    {
      key: 'min_order_amount',
      title: 'Đơn tối thiểu',
      width: '130px',
      render: (c) =>
        c.min_order_amount ? `${c.min_order_amount.toLocaleString('vi-VN')} đ` : 'Không yêu cầu',
    },
    {
      key: 'usage',
      title: 'Lượt dùng',
      width: '120px',
      render: (c) => (
        <span>
          <strong>{c.used_count}</strong>
          <span style={{ color: '#64748b' }}> / {c.usage_limit ?? '∞'}</span>
        </span>
      ),
    },
    {
      key: 'per_user_limit',
      title: 'Mỗi khách',
      width: '100px',
      render: (c) => `${c.per_user_limit} lần`,
    },
    {
      key: 'validity',
      title: 'Thời hạn',
      width: '140px',
      render: (c) => {
        const expired = isExpired(c.end_at);
        return (
          <div style={{ fontSize: '12px' }}>
            <div>{new Date(c.start_at).toLocaleDateString('vi-VN')}</div>
            <div>→ {new Date(c.end_at).toLocaleDateString('vi-VN')}</div>
            {expired && (
              <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                HẾT HẠN
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '130px',
      render: (c) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(c)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: c.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
            color: c.status === 'ACTIVE' ? '#166534' : '#475569',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          title="Bấm để bật/tắt kích hoạt"
        >
          {c.status === 'ACTIVE' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          <span>{c.status}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      title: 'Hành động',
      width: '130px',
      align: 'center',
      render: (c) => (
        <ActionButtons
          actions={[
            {
              key: 'history',
              icon: History,
              title: 'Xem lịch sử sử dụng',
              onClick: () => setSelectedCouponForUsage(c),
              variant: 'view',
            },
            {
              key: 'edit',
              icon: Edit2,
              title: 'Chỉnh sửa mã giảm giá',
              onClick: () => navigate(`/admin/coupons/edit/${c._id}`),
              variant: 'edit',
            },
            {
              key: 'delete',
              icon: Trash2,
              title: 'Xóa mã giảm giá',
              onClick: () => handleDelete(c._id),
              variant: 'delete',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={24} color="var(--primary-color)" /> Quản lý Mã giảm giá (Coupon)
          </span>
        }
        subtitle="Quản lý các chương trình ưu đãi, kiểm tra lượt sử dụng và cấu hình điều kiện áp dụng"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => fetchCoupons(pagination.page)} title="Làm mới danh sách">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Làm mới</span>
            </button>
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
              <span>Thêm Coupon mới</span>
            </button>
          </>
        }
      />

      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo mã hoặc mô tả..."
        onSearchSubmit={() => fetchCoupons(1)}
        filters={[
          {
            key: 'status',
            value: filterStatus,
            onChange: (val) => setFilterStatus(val),
            placeholder: 'Tất cả trạng thái',
            options: [
              { value: 'ACTIVE', label: 'Đang kích hoạt (ACTIVE)' },
              { value: 'INACTIVE', label: 'Tạm tắt (INACTIVE)' },
            ],
            width: '200px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      <AdminDataTable
        columns={columns}
        data={coupons}
        loading={loading}
        error={error}
        emptyText="Chưa có mã giảm giá nào phù hợp."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchCoupons(p, pagination.limit)}
        onPageSizeChange={(newLimit) => fetchCoupons(1, newLimit)}
      />

      {/* Các Modals giữ nguyên */}
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
