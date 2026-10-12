import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

const API_URL = '/categories';

/**
 * Categories Component - Trang quản lý danh sách Danh mục (CRUD)
 * Hỗ trợ: xem danh sách, tạo mới, sửa, xóa mềm
 */
function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh mục từ API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get(API_URL);
      setCategories(res.data?.categories || res.data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
      alert('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Xóa mềm danh mục
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await axiosAdmin.delete(`${API_URL}/${id}`);
      fetchCategories();
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa danh mục');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý Danh mục</h1>
        <button className="btn btn-primary" onClick={() => navigate('/admin/categories/create')}>
          <Plus size={18} />
          <span>Thêm Danh mục</span>
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
                  <th>Tên danh mục</th>
                  <th>Slug</th>
                  <th>Mô tả</th>
                  <th>Vị trí</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                      Chưa có dữ liệu danh mục
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat._id}>
                      <td>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '50px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{cat.name}</td>
                      <td>{cat.slug}</td>
                      <td>{cat.description || '-'}</td>
                      <td>{cat.position}</td>
                      <td>
                        <span className={`status-badge ${cat.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                          {cat.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn" title="Sửa" onClick={() => navigate(`/admin/categories/edit/${cat._id}`)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn delete" title="Xóa" onClick={() => handleDelete(cat._id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Categories;

