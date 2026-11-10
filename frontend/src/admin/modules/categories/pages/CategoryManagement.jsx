import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import axiosAdmin from '../../..//config/axiosAdmin';
import {
  AdminPageHeader,
  AdminDataTable,
  StatusBadge,
  ActionButtons,
} from '../../..//components/common';

const API_URL = '/categories';

const STATUS_MAP = {
  ACTIVE: { label: 'Hoạt động', className: 'status-active' },
  INACTIVE: { label: 'Ngừng', className: 'status-inactive' },
};

/**
 * Categories Component - Trang quản lý danh sách Danh mục Tour
 */
function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosAdmin.get(API_URL);
      setCategories(res.data?.categories || res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
      setError('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await axiosAdmin.delete(`${API_URL}/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa danh mục');
    }
  };

  const columns = [
    {
      key: 'image',
      title: 'Ảnh',
      width: '80px',
      align: 'center',
      render: (cat) =>
        cat.image ? (
          <img
            src={cat.image}
            alt={cat.name}
            style={{ width: '50px', height: '38px', objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div style={{ width: '50px', height: '38px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
        ),
    },
    {
      key: 'name',
      title: 'Tên danh mục',
      render: (cat) => <span style={{ fontWeight: 600 }}>{cat.name}</span>,
    },
    {
      key: 'slug',
      title: 'Slug',
      render: (cat) => <code style={{ fontSize: '13px' }}>{cat.slug}</code>,
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (cat) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {cat.description || '-'}
        </span>
      ),
    },
    {
      key: 'position',
      title: 'Vị trí',
      width: '90px',
      align: 'center',
      render: (cat) => cat.position ?? 0,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '120px',
      render: (cat) => <StatusBadge status={cat.status} statusMap={STATUS_MAP} />,
    },
    {
      key: 'actions',
      title: 'Hành động',
      width: '120px',
      align: 'center',
      render: (cat) => (
        <ActionButtons
          actions={[
            {
              key: 'edit',
              icon: Edit2,
              title: 'Chỉnh sửa danh mục',
              onClick: () => navigate(`/admin/categories/edit/${cat._id}`),
              variant: 'edit',
            },
            {
              key: 'delete',
              icon: Trash2,
              title: 'Xóa danh mục',
              onClick: () => handleDelete(cat._id),
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
        title="Quản lý Danh mục"
        subtitle="Cấu hình cây danh mục tour trong nước và quốc tế hiển thị trên trang chủ và menu"
        actions={
          <>
            <button className="btn btn-secondary" onClick={fetchCategories} title="Làm mới danh sách">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Làm mới</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/admin/categories/create')}>
              <Plus size={18} />
              <span>Thêm Danh mục mới</span>
            </button>
          </>
        }
      />

      <AdminDataTable
        columns={columns}
        data={categories}
        loading={loading}
        error={error}
        emptyText="Chưa có dữ liệu danh mục nào."
      />
    </div>
  );
}

export default Categories;
