import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Calendar } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

const REGION_NAMES = {
  MIEN_BAC: 'Miền Bắc', MIEN_TRUNG: 'Miền Trung', MIEN_NAM: 'Miền Nam',
  CHAU_A: 'Châu Á', CHAU_AU: 'Châu Âu', CHAU_MY: 'Châu Mỹ', CHAU_UC: 'Châu Úc',
};

const STATUS_MAP = {
  ACTIVE: { label: 'Hoạt động', className: 'status-active' },
  INACTIVE: { label: 'Ngừng HĐ', className: 'status-inactive' },
  DRAFT: { label: 'Bản nháp', className: 'status-draft' },
};

/**
 * Tours Component - Quản lý danh sách Tour du lịch (Admin)
 */
function Tours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();
      const res = await axiosAdmin.get('/tours', { params });
      setTours(res.data?.tours || []);
    } catch (error) {
      alert(error?.message || 'Không thể tải danh sách tour');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchTours(); }, 250);
    return () => clearTimeout(timer);
  }, [fetchTours]);

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
    } catch (error) {
      alert(error?.message || 'Lỗi khi xóa Tour');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý Tour Du Lịch</h1>
        <button className="btn btn-primary" onClick={() => navigate('/admin/tours/create')}>
          <Plus size={18} /><span>Thêm Tour mới</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo tên hoặc mã Tour..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
          <div style={{ width: '160px' }}>
            <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">Tất cả phân loại</option>
              <option value="DOMESTIC">Trong nước</option>
              <option value="INTERNATIONAL">Quốc tế</option>
            </select>
          </div>
          <div style={{ width: '160px' }}>
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="INACTIVE">Ngừng HĐ (INACTIVE)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '24px' }}>Đang tải danh sách Tour...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th><th>Mã Tour</th><th>Tên Tour</th><th>Thời lượng</th>
                  <th>Giá bán (sale_price)</th><th>Phân loại / Vùng</th><th>Trạng thái</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {tours.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Không tìm thấy tour phù hợp</td></tr>
                ) : (
                  tours.map((tour) => {
                    const st = STATUS_MAP[tour.status] || { label: tour.status, className: '' };
                    return (
                      <tr key={tour._id}>
                        <td>
                          {tour.main_image ? (
                            <img src={tour.main_image} alt={tour.title} style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: '56px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{tour.code}</td>
                        <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tour.title}>
                          {tour.title}
                          {tour.is_hot && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>🔥 HOT</span>}
                        </td>
                        <td>{tour.duration}</td>
                        <td>
                          <div style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
                            {formatCurrency(tour.sale_price || tour.original_price)}
                          </div>
                          {tour.discount_percent > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'line-through' }}>
                              {formatCurrency(tour.original_price)} (-{tour.discount_percent}%)
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            {tour.category === 'DOMESTIC' ? 'Trong nước' : 'Quốc tế'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {REGION_NAMES[tour.region] || tour.region || '-'}
                          </div>
                        </td>
                        <td><span className={`status-badge ${st.className}`}>{st.label}</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn" title="Quản lý ngày khởi hành" onClick={() => navigate(`/admin/tours/edit/${tour._id}?tab=departures`)} style={{ color: 'var(--primary-color)' }}>
                              <Calendar size={16} />
                            </button>
                            <button className="icon-btn" title="Chỉnh sửa thông tin Tour" onClick={() => navigate(`/admin/tours/edit/${tour._id}`)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="icon-btn delete" title="Xóa Tour" onClick={() => handleDelete(tour._id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tours;

