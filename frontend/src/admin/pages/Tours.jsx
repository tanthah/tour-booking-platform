import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

/**
 * Tours Component - Trang quản lý danh sách Tour (CRUD)
 * Hỗ trợ: xem danh sách, tạo mới, sửa, xóa mềm, đổi trạng thái
 */
function Tours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách Tour từ API
  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get('/tours');
      setTours(res.data?.tours || []);
    } catch (error) {
      console.error('Lỗi khi tải tours:', error);
      alert('Không thể tải danh sách tour');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // Format tiền tệ VND
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 VND';
    return value.toLocaleString('vi-VN') + ' VND';
  };

  // Xóa mềm Tour
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Tour này?')) return;
    try {
      await axiosAdmin.delete(`/tours/${id}`);
      fetchTours();
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa Tour');
    }
  };

  // Map trạng thái Tour sang nhãn hiển thị và class CSS
  const getStatusInfo = (status) => {
    const map = {
      ACTIVE: { label: 'Hoạt động', className: 'status-active' },
      INACTIVE: { label: 'Ngừng hoạt động', className: 'status-inactive' },
      DRAFT: { label: 'Bản nháp', className: 'status-draft' },
      PUBLISHED: { label: 'Đã xuất bản', className: 'status-active' },
      FULL: { label: 'Hết chỗ', className: 'status-inactive' },
      CLOSED: { label: 'Đã đóng', className: 'status-inactive' },
      CANCELLED: { label: 'Đã hủy', className: 'status-inactive' },
    };
    return map[status] || { label: status, className: '' };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý Tour</h1>
        <button className="btn btn-primary" onClick={() => navigate('/admin/tours/create')}>
          <Plus size={18} />
          <span>Thêm Tour mới</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Mã Tour</th>
                  <th>Tên Tour</th>
                  <th>Giá hiển thị</th>
                  <th>Chỗ còn / Tổng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {tours.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                      Chưa có dữ liệu tour
                    </td>
                  </tr>
                ) : (
                  tours.map((tour) => {
                    const statusInfo = getStatusInfo(tour.status);
                    return (
                      <tr key={tour._id}>
                        <td>
                          {tour.main_image ? (
                            <img src={tour.main_image} alt={tour.title} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: '60px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{tour.code}</td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tour.title}>
                          {tour.title}
                        </td>
                        <td style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
                          {formatCurrency(tour.price)}
                        </td>
                        <td>
                          <span style={{ color: tour.remaining_slots === 0 ? 'var(--danger-color)' : 'inherit' }}>
                            {tour.remaining_slots} / {tour.total_slots}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn" title="Xem chi tiết" onClick={() => navigate(`/admin/tours/edit/${tour._id}`)}>
                              <Eye size={16} />
                            </button>
                            <button className="icon-btn" title="Sửa" onClick={() => navigate(`/admin/tours/edit/${tour._id}`)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="icon-btn delete" title="Xóa" onClick={() => handleDelete(tour._id)}>
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

