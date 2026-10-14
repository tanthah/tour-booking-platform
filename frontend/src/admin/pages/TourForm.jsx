import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useTourForm from '../hooks/useTourForm';
import ImageUploader from '../components/ImageUploader';
import ItineraryEditor from '../components/ItineraryEditor';
import TourDepartures from '../components/TourDepartures';

/**
 * TourForm Component - Form tạo mới / cập nhật Tour
 */
function TourForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const autoAdd = searchParams.get('autoAdd') === 'true';

  const {
    formData, loading, submitting, isEdit,
    handleChange, setField, handleSubmit, navigate, tourId
  } = useTourForm(id);

  const [userTab, setUserTab] = useState(null);
  const activeTab = userTab || (tabFromQuery === 'departures' && isEdit ? 'departures' : 'info');

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Cập nhật Tour' : 'Tạo Tour'}</h1>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/tours')}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Quay lại danh sách
        </button>
      </div>

      {isEdit && (
        <div className="tabs-container" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setUserTab('info')}
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'info' ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === 'info' ? '600' : '400', color: activeTab === 'info' ? 'var(--primary-color)' : 'inherit' }}
          >
            Thông tin chung
          </button>
          <button
            className={`tab-btn ${activeTab === 'departures' ? 'active' : ''}`}
            onClick={() => setUserTab('departures')}
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'departures' ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === 'departures' ? '600' : '400', color: activeTab === 'departures' ? 'var(--primary-color)' : 'inherit' }}
          >
            Đợt khởi hành
          </button>
        </div>
      )}

      {activeTab === 'info' && (
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
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setField('category', newCat);
                    if (newCat === 'DOMESTIC') setField('region', 'MIEN_BAC');
                    else setField('region', 'CHAU_A');
                  }}
                  required
                >
                  <option value="DOMESTIC">Trong nước (DOMESTIC)</option>
                  <option value="INTERNATIONAL">Quốc tế (INTERNATIONAL)</option>
                </select>
              </div>
            </div>

            {/* Mã tour, Khu vực, Trạng thái */}
            <div className="form-row form-row-3">
              <div className="form-group form-col">
                <label className="form-label">Mã tour</label>
                <input type="text" name="code" className="form-control" placeholder="VD: DN01" value={formData.code} onChange={handleChange} required disabled={isEdit} />
              </div>
              <div className="form-group form-col">
                <label className="form-label">Khu vực</label>
                <select name="region" className="form-control" value={formData.region} onChange={handleChange}>
                  {formData.category === 'DOMESTIC' ? (
                    <>
                      <option value="MIEN_BAC">Miền Bắc</option>
                      <option value="MIEN_TRUNG">Miền Trung</option>
                      <option value="MIEN_NAM">Miền Nam</option>
                    </>
                  ) : (
                    <>
                      <option value="CHAU_A">Châu Á</option>
                      <option value="CHAU_AU">Châu Âu</option>
                      <option value="CHAU_MY">Châu Mỹ</option>
                      <option value="CHAU_UC">Châu Úc</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group form-col">
                <label className="form-label">Trạng thái</label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                </select>
              </div>
            </div>

            {/* Điểm đến và Thời lượng */}
            <div className="form-row">
              <div className="form-group form-col">
                <label className="form-label">Điểm đến</label>
                <input type="text" name="destination_location" className="form-control" placeholder="Nhập điểm đến chính..." value={formData.destination_location} onChange={handleChange} required />
              </div>
              <div className="form-group form-col">
                <label className="form-label">Thời lượng</label>
                <input type="text" name="duration" className="form-control" placeholder="VD: 3 Ngày 2 Đêm" value={formData.duration} onChange={handleChange} required />
              </div>
            </div>

            {/* Giá gốc và Giảm giá */}
            <div className="form-row">
              <div className="form-group form-col">
                <label className="form-label">Giá gốc (VNĐ)</label>
                <input type="number" name="original_price" className="form-control" value={formData.original_price} onChange={handleChange} min="0" required />
              </div>
              <div className="form-group form-col">
                <label className="form-label">Phần trăm giảm (%)</label>
                <input type="number" name="discount_percent" className="form-control" value={formData.discount_percent} onChange={handleChange} min="0" max="100" />
              </div>
            </div>
            {formData.original_price > 0 && (
              <p style={{ color: 'var(--success-color)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Giá bán ước tính: <strong>{(formData.original_price * (100 - formData.discount_percent) / 100).toLocaleString('vi-VN')} VNĐ</strong>
              </p>
            )}

            {/* Ảnh đại diện */}
            <div className="form-group">
              <label className="form-label">Ảnh đại diện</label>
              <ImageUploader value={formData.main_image} onChange={(url) => setField('main_image', url)} />
            </div>

            {/* Thư viện ảnh gallery */}
            <div className="form-group">
              <label className="form-label">Thư viện ảnh (Gallery - chọn cùng lúc tối đa 5 ảnh)</label>
              <ImageUploader multiple={true} maxBatch={5} images={formData.gallery || []} onImagesChange={(urls) => setField('gallery', urls)} />
            </div>

            {/* Thông tin tour chi tiết (HTML) */}
            <div className="form-group">
              <label className="form-label">Nội dung chi tiết (Mô tả)</label>
              <textarea name="content_html" className="form-control" rows="6" placeholder="Nhập nội dung chi tiết..." value={formData.content_html} onChange={handleChange} />
            </div>

            {/* Lịch trình tour */}
            <div className="form-group">
              <label className="form-label">Lịch trình tour</label>
              <ItineraryEditor items={formData.itinerary} onChange={(items) => setField('itinerary', items)} />
            </div>

            {/* Nút hành động */}
            <div className="form-actions" style={{ marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : isEdit ? 'Cập nhật Tour' : 'Tạo Tour'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'departures' && isEdit && (
        <TourDepartures productId={tourId} autoOpenAdd={autoAdd} />
      )}
    </div>
  );
}

export default TourForm;
