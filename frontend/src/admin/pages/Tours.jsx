import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, Eye, RefreshCw } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
  StatusBadge,
  ActionButtons,
} from '../components/common';

const REGION_NAMES = {
  MIEN_BAC: 'Miền Bắc',
  MIEN_TRUNG: 'Miền Trung',
  MIEN_NAM: 'Miền Nam',
  CHAU_A: 'Châu Á',
  CHAU_AU: 'Châu Âu',
  CHAU_MY: 'Châu Mỹ',
  CHAU_UC: 'Châu Úc',
};

const STATUS_MAP = {
  ACTIVE: { label: 'Hoạt động', className: 'status-active' },
  INACTIVE: { label: 'Ngừng HĐ', className: 'status-inactive' },
  DRAFT: { label: 'Bản nháp', className: 'status-draft' },
};

/**
 * Tours Component - Quản lý danh sách Tour du lịch (Admin)
 * Chuẩn hoá giao diện theo Mẫu 1 (Bảng có bộ lọc nâng cao)
 */
function Tours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: pageSize,
      };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'ALL') params.category = categoryFilter;
      if (regionFilter && regionFilter !== 'ALL') params.region = regionFilter;
      if (search.trim()) params.search = search.trim();

      const res = await axiosAdmin.get('/tours', { params });
      setTours(res.data?.tours || []);
      setPagination({
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách tour');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, categoryFilter, regionFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTours();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTours]);

  // Hàm xoá toàn bộ bộ lọc
  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setRegionFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Tour này?')) return;
    try {
      await axiosAdmin.delete(`/tours/${id}`);
      alert('Đã xóa Tour thành công');
      fetchTours();
    } catch (err) {
      alert(err?.message || 'Lỗi khi xóa Tour');
    }
  };

  // Cấu hình các cột hiển thị theo Mẫu 1 (STT được AdminDataTable tự động thêm ở đầu)
  const columns = [
    {
      key: 'main_image',
      title: 'Ảnh',
      width: '80px',
      align: 'center',
      render: (tour) =>
        tour.main_image ? (
          <img
            src={tour.main_image}
            alt={tour.title}
            style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div style={{ width: '56px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
        ),
    },
    {
      key: 'code',
      title: 'Mã Tour',
      width: '120px',
      render: (tour) => <span style={{ fontWeight: 600 }}>{tour.code}</span>,
    },
    {
      key: 'title',
      title: 'Tên Tour',
      render: (tour) => (
        <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tour.title}>
          {tour.title}
          {tour.is_hot && (
            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
              🔥 HOT
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'duration',
      title: 'Thời lượng',
      width: '120px',
      render: (tour) => tour.duration || '-',
    },
    {
      key: 'sale_price',
      title: 'Giá bán (sale_price)',
      width: '160px',
      render: (tour) => (
        <div>
          <div style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
            {formatCurrency(tour.sale_price || tour.original_price)}
          </div>
          {tour.discount_percent > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'line-through' }}>
              {formatCurrency(tour.original_price)} (-{tour.discount_percent}%)
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category_region',
      title: 'Phân loại / Vùng',
      width: '160px',
      render: (tour) => (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {tour.category === 'DOMESTIC' ? 'Trong nước' : 'Quốc tế'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {REGION_NAMES[tour.region] || tour.region || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '130px',
      render: (tour) => <StatusBadge status={tour.status} statusMap={STATUS_MAP} />,
    },
    {
      key: 'actions',
      title: 'Hành động',
      width: '150px',
      align: 'center',
      render: (tour) => (
        <ActionButtons
          actions={[
            {
              key: 'view',
              icon: Eye,
              title: 'Xem tour trên website',
              to: `/tour/${tour._id}`,
              variant: 'view',
            },
            {
              key: 'departures',
              icon: Calendar,
              title: 'Quản lý lịch khởi hành',
              onClick: () => navigate(`/admin/tours/edit/${tour._id}?tab=departures`),
              variant: 'calendar',
            },
            {
              key: 'edit',
              icon: Edit2,
              title: 'Chỉnh sửa thông tin Tour',
              onClick: () => navigate(`/admin/tours/edit/${tour._id}`),
              variant: 'edit',
            },
            {
              key: 'delete',
              icon: Trash2,
              title: 'Xóa Tour',
              onClick: () => handleDelete(tour._id),
              variant: 'delete',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Tiêu đề trang & Nút hành động chính */}
      <AdminPageHeader
        title="Quản lý Tour Du Lịch"
        subtitle="Quản lý thông tin chi tiết tour, giá khuyến mãi, lịch trình và các đợt khởi hành"
        actions={
          <>
            <button className="btn btn-secondary" onClick={fetchTours} title="Làm mới danh sách">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Làm mới</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/admin/tours/create')}>
              <Plus size={18} />
              <span>Thêm Tour mới</span>
            </button>
          </>
        }
      />

      {/* Khung tìm kiếm và bộ lọc nâng cao */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo tên hoặc mã Tour..."
        filters={[
          {
            key: 'category',
            value: categoryFilter,
            onChange: (val) => {
              setCategoryFilter(val);
              setPage(1);
            },
            placeholder: 'Tất cả phân loại',
            options: [
              { value: 'DOMESTIC', label: 'Trong nước' },
              { value: 'INTERNATIONAL', label: 'Quốc tế' },
            ],
            width: '160px',
          },
          {
            key: 'region',
            value: regionFilter,
            onChange: (val) => {
              setRegionFilter(val);
              setPage(1);
            },
            placeholder: 'Tất cả vùng',
            options: [
              { value: 'MIEN_BAC', label: 'Miền Bắc' },
              { value: 'MIEN_TRUNG', label: 'Miền Trung' },
              { value: 'MIEN_NAM', label: 'Miền Nam' },
              { value: 'CHAU_A', label: 'Châu Á' },
              { value: 'CHAU_AU', label: 'Châu Âu' },
              { value: 'CHAU_MY', label: 'Châu Mỹ' },
              { value: 'CHAU_UC', label: 'Châu Úc' },
            ],
            width: '160px',
          },
          {
            key: 'status',
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setPage(1);
            },
            placeholder: 'Tất cả trạng thái',
            options: [
              { value: 'ACTIVE', label: 'Hoạt động (ACTIVE)' },
              { value: 'DRAFT', label: 'Bản nháp (DRAFT)' },
              { value: 'INACTIVE', label: 'Ngừng HĐ (INACTIVE)' },
            ],
            width: '160px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      {/* Bảng dữ liệu chuẩn Mẫu 1 */}
      <AdminDataTable
        columns={columns}
        data={tours}
        loading={loading}
        error={error}
        emptyText="Không tìm thấy tour phù hợp."
        currentPage={page}
        pageSize={pageSize}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />
    </div>
  );
}

export default Tours;
