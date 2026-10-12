import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import ImageUploader from '../components/ImageUploader';

/**
 * CategoryForm Component - Form tạo mới / cập nhật Danh mục
 * Các trường: tên danh mục, danh mục cha, vị trí, trạng thái, ảnh đại diện, mô tả
 */
function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Danh sach danh muc cha (dung cho dropdown)
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Du lieu form
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    position: 0,
    status: 'ACTIVE',
    image: '',
    description: '',
  });

  // Lay danh sach danh muc cha (ACTIVE) de hien thi dropdown
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const res = await axiosAdmin.get('/categories/active');
        if (res?.success) {
          // Loc bo chinh no ra khoi danh sach danh muc cha (khi dang sua)
          const list = (res.data || []).filter((cat) => cat._id !== id);
          setParentCategories(list);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục cha:', err);
      }
    };
    fetchParentCategories();
  }, [id]);

  // Khi sua: tai du lieu danh muc hien tai tu API
  useEffect(() => {
    if (!isEdit) return;
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const res = await axiosAdmin.get(`/categories/${id}`);
        if (res?.success && res.data) {
          const cat = res.data;
          setFormData({
            name: cat.name || '',
            parent_id: cat.parent_id?._id || cat.parent_id || '',
            position: cat.position || 0,
            status: cat.status || 'ACTIVE',
            image: cat.image || '',
            description: cat.description || '',
          });
        }
      } catch (err) {
        alert(err.message || 'Không thể tải thông tin danh mục');
        navigate('/admin/categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id, isEdit, navigate]);

  // Cập nhật giá trị trường form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gửi dữ liệu form lên API (tạo mới hoặc cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        position: Number(formData.position),
        parent_id: formData.parent_id || null,
      };

      if (isEdit) {
        await axiosAdmin.put(`/categories/${id}`, payload);
        alert('Cập nhật danh mục thành công');
      } else {
        await axiosAdmin.post('/categories', payload);
        alert('Tạo danh mục thành công');
      }
      navigate('/admin/categories');
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Cập nhật danh mục' : 'Tạo danh mục'}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Hàng 1: Tên danh mục và Danh mục cha */}
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Tên danh mục</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Nhập tên danh mục..."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Danh mục cha</label>
              <select name="parent_id" className="form-control" value={formData.parent_id} onChange={handleChange}>
                <option value="">-- Chọn danh mục --</option>
                {parentCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 2: Vị trí và Trạng thái */}
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Vị trí</label>
              <input type="number" name="position" className="form-control" value={formData.position} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Trạng thái</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          {/* Ảnh đại diện */}
          <div className="form-group">
            <label className="form-label">Ảnh đại diện</label>
            <ImageUploader value={formData.image} onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))} />
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              name="description"
              className="form-control"
              rows="3"
              placeholder="Mô tả danh mục..."
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
            />
          </div>

          {/* Nút hành động */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button type="button" className="btn-link" onClick={() => navigate('/admin/categories')}>
              <ArrowLeft size={14} style={{ marginRight: '4px' }} />
              Quay lại danh sách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryForm;

