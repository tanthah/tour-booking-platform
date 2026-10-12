import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useTourForm from '../hooks/useTourForm';
import ImageUploader from '../components/ImageUploader';
import ItineraryEditor from '../components/ItineraryEditor';

/**
 * TourForm Component - Form tạo mới / cập nhật Tour
 * Giao diện theo mẫu thiết kế: thông tin cơ bản, giá cả, chỗ ngồi,
 * địa điểm, lịch trình, ảnh đại diện, thông tin tour
 */
function TourForm() {
  const { id } = useParams();
  const {
    formData, categories, loading, submitting, isEdit, departureOptions,
    handleChange, setField, handleSubmit, navigate,
  } = useTourForm(id);

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Cập nhật Tour' : 'Tạo Tour'}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Tên tour và Danh mục */}
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Tên tour</label>
              <input type="text" name="title" className="form-control" placeholder="Nhập tên tour..." value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Danh mục</label>
              <select name="category" className="form-control" value={formData.category} onChange={handleChange} required>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mã tour và Trạng thái */}
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Mã tour</label>
              <input type="text" name="code" className="form-control" placeholder="VD: DN01" value={formData.code} onChange={handleChange} required disabled={isEdit} />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Trạng thái</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
                <option value="DRAFT">Bản nháp</option>
              </select>
            </div>
          </div>

          {/* Ảnh đại diện */}
          <div className="form-group">
            <label className="form-label">Ảnh đại diện</label>
            <ImageUploader value={formData.main_image} onChange={(url) => setField('main_image', url)} />
          </div>

          {/* Giá cũ (Giá gốc) */}
          <div className="form-section-title">Giá cũ</div>
          <div className="form-row form-row-3">
            <div className="form-group form-col">
              <label className="form-label">Người lớn</label>
              <input type="number" name="original_price_adult" className="form-control" value={formData.original_price_adult} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Trẻ em</label>
              <input type="number" name="original_price_child" className="form-control" value={formData.original_price_child} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Em bé</label>
              <input type="number" name="original_price_baby" className="form-control" value={formData.original_price_baby} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* Giá mới (Giá hiện tại) */}
          <div className="form-section-title">Giá mới</div>
          <div className="form-row form-row-3">
            <div className="form-group form-col">
              <label className="form-label">Người lớn</label>
              <input type="number" name="price_adult" className="form-control" value={formData.price_adult} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Trẻ em</label>
              <input type="number" name="price_child" className="form-control" value={formData.price_child} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Em bé</label>
              <input type="number" name="price_baby" className="form-control" value={formData.price_baby} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* Giá chính (giá hiển thị chung) và Giá gốc */}
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Giá hiển thị (chính)</label>
              <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} min="0" required />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Giá gốc (trước giảm)</label>
              <input type="number" name="original_price" className="form-control" value={formData.original_price} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* Còn lại (Slots) */}
          <div className="form-section-title">Còn lại</div>
          <div className="form-row form-row-3">
            <div className="form-group form-col">
              <label className="form-label">Người lớn</label>
              <input type="number" name="max_adults" className="form-control" value={formData.max_adults} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Trẻ em</label>
              <input type="number" name="max_children" className="form-control" value={formData.max_children} onChange={handleChange} min="0" />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Em bé</label>
              <input type="number" name="max_babies" className="form-control" value={formData.max_babies} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* Tổng số chỗ và Số chỗ còn lại */}
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Tổng số chỗ</label>
              <input type="number" name="total_slots" className="form-control" value={formData.total_slots} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Số chỗ còn lại</label>
              <input type="number" name="remaining_slots" className="form-control" value={formData.remaining_slots} onChange={handleChange} min="0" required />
            </div>
          </div>

          {/* Những địa điểm có tour (Checkboxes) */}
          <div className="form-group">
            <label className="form-label">Những địa điểm có tour</label>
            <div className="checkbox-group">
              {departureOptions.map((city) => (
                <label key={city} className="checkbox-label">
                  <input
                    type="radio"
                    name="departure_location"
                    value={city}
                    checked={formData.departure_location === city}
                    onChange={handleChange}
                  />
                  <span>{city}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Điểm đến */}
          <div className="form-group">
            <label className="form-label">Điểm đến</label>
            <input type="text" name="destination_location" className="form-control" placeholder="Nhập điểm đến..." value={formData.destination_location} onChange={handleChange} required />
          </div>

          {/* Thời gian, Phương tiện, Ngày khởi hành */}
          <div className="form-row form-row-3">
            <div className="form-group form-col">
              <label className="form-label">Thời gian</label>
              <input type="text" name="duration" className="form-control" placeholder="VD: 6 Ngày 5 Đêm" value={formData.duration} onChange={handleChange} required />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Phương tiện</label>
              <input type="text" name="vehicle" className="form-control" placeholder="VD: Ô tô 45 chỗ" value={formData.vehicle} onChange={handleChange} />
            </div>
            <div className="form-group form-col">
              <label className="form-label">Ngày khởi hành</label>
              <input type="date" name="departure_date" className="form-control" value={formData.departure_date} onChange={handleChange} required />
            </div>
          </div>

          {/* Thông tin tour (Mô tả ngắn) */}
          <div className="form-group">
            <label className="form-label">Thông tin tour</label>
            <textarea name="description" className="form-control" rows="4" placeholder="Thông tin tour..." value={formData.description} onChange={handleChange} />
          </div>

          {/* Lịch trình tour */}
          <div className="form-group">
            <label className="form-label">Lịch trình tour</label>
            <ItineraryEditor items={formData.itinerary} onChange={(items) => setField('itinerary', items)} />
          </div>

          {/* Nút hành động */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button type="button" className="btn-link" onClick={() => navigate('/admin/tours')}>
              <ArrowLeft size={14} style={{ marginRight: '4px' }} />
              Quay lại danh sách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TourForm;

