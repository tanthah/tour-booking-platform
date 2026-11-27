import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import axiosAdmin from '../../..//config/axiosAdmin';
import useTourForm from '../hooks/useTourForm';
import { ImageUploader } from '../../..//components/common';
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
    handleChange, setField, setFields, handleSubmit, navigate, tourId
  } = useTourForm(id);

  // Tải danh mục từ cơ sở dữ liệu
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosAdmin.get('/categories/active');
        setCategories(res?.data || []);
      } catch (err) {
        console.error('Lỗi khi tải danh mục tour:', err);
      }
    };
    fetchCategories();
  }, []);

  // Phân nhóm danh mục theo Tour trong nước và Tour nước ngoài
  const domesticRoot = categories.find((c) => !c.parent_id && (c.code === 'DOMESTIC' || c.slug === 'tour-trong-nuoc'));
  const intlRoot = categories.find((c) => !c.parent_id && (c.code === 'INTERNATIONAL' || c.slug === 'tour-nuoc-ngoai'));

  const domesticSubs = categories.filter((c) => {
    const parentId = c.parent_id?._id || c.parent_id;
    return parentId && domesticRoot && String(parentId) === String(domesticRoot._id);
  });

  const intlSubs = categories.filter((c) => {
    const parentId = c.parent_id?._id || c.parent_id;
    return parentId && intlRoot && String(parentId) === String(intlRoot._id);
  });

  const otherCats = categories.filter((c) => {
    const isRoot = !c.parent_id;
    const parentId = c.parent_id?._id || c.parent_id;
    const isDomesticSub = domesticRoot && String(parentId) === String(domesticRoot._id);
    const isIntlSub = intlRoot && String(parentId) === String(intlRoot._id);
    return !isRoot && !isDomesticSub && !isIntlSub;
  });

  const [userTab, setUserTab] = useState(null);
  const activeTab = userTab || (tabFromQuery === 'departures' && isEdit ? 'departures' : 'info');

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>;
  }

  const origPrice = Number(formData.original_price) || 0;
  const discPercent = Number(formData.discount_percent) || 0;
  const estimatedAdultPrice = Math.round(origPrice * (100 - discPercent) / 100);
  const hasCustomChildPrice = formData.price_child !== '' && formData.price_child !== null && formData.price_child !== undefined;
  const hasCustomBabyPrice = formData.price_baby !== '' && formData.price_baby !== null && formData.price_baby !== undefined;
  const estimatedChildPrice = hasCustomChildPrice ? Number(formData.price_child) : Math.round(estimatedAdultPrice * 0.6);
  const estimatedBabyPrice = hasCustomBabyPrice ? Number(formData.price_baby) : Math.round(estimatedAdultPrice * 0.2);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Cập nhật Tour' : 'Tạo Tour'}</h1>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/tours')}>
          <ArrowLeft size={16} /> <span>Quay lại danh sách</span>
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
            {/* Tên tour và Danh mục (chọn từ CSDL) */}
            <div className="form-row">
              <div className="form-group form-col">
                <label className="form-label">Tên tour <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="title" className="form-control" placeholder="Nhập tên tour..." value={formData.title} onChange={handleChange} required />
              </div>
              <div className="form-group form-col">
                <label className="form-label">Danh mục <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  name="category_id"
                  className="form-control"
                  value={formData.category_id || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn danh mục tour --</option>
                  {domesticSubs.length > 0 && (
                    <optgroup label="Tour trong nước">
                      {domesticSubs.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {intlSubs.length > 0 && (
                    <optgroup label="Tour nước ngoài">
                      {intlSubs.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherCats.length > 0 && (
                    <optgroup label="Danh mục khác">
                      {otherCats.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {/* Fallback nếu danh mục cha chưa có con */}
                  {domesticSubs.length === 0 && domesticRoot && (
                    <option value={domesticRoot._id}>{domesticRoot.name}</option>
                  )}
                  {intlSubs.length === 0 && intlRoot && (
                    <option value={intlRoot._id}>{intlRoot.name}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Mã tour và Trạng thái (đã bỏ ô Khu vực) */}
            <div className="form-row">
              <div className="form-group form-col">
                <label className="form-label">Mã tour <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="code" className="form-control" placeholder="VD: DN01" value={formData.code} onChange={handleChange} required disabled={isEdit} />
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

            {/* Giá trẻ em và Giá em bé */}
            <div className="form-row">
              <div className="form-group form-col">
                <label className="form-label">Giá trẻ em (VNĐ)</label>
                <input
                  type="number"
                  name="price_child"
                  className="form-control"
                  placeholder="Để trống = 60% giá bán"
                  value={formData.price_child}
                  onChange={handleChange}
                  min="0"
                />
                <small style={{ color: '#64748b', fontSize: '0.82rem', display: 'block', marginTop: '4px' }}>
                  Để trống hệ thống tự tính bằng 60% giá bán người lớn (nhập 0 nếu miễn phí).
                </small>
              </div>
              <div className="form-group form-col">
                <label className="form-label">Giá em bé (VNĐ)</label>
                <input
                  type="number"
                  name="price_baby"
                  className="form-control"
                  placeholder="Để trống = 20% giá bán"
                  value={formData.price_baby}
                  onChange={handleChange}
                  min="0"
                />
                <small style={{ color: '#64748b', fontSize: '0.82rem', display: 'block', marginTop: '4px' }}>
                  Để trống hệ thống tự tính bằng 20% giá bán người lớn (nhập 0 nếu miễn phí).
                </small>
              </div>
            </div>

            {(origPrice > 0 || hasCustomChildPrice || hasCustomBabyPrice) && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                  Bảng giá bán ước tính
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Người lớn: </span>
                    <strong style={{ color: 'var(--success-color)' }}>{estimatedAdultPrice.toLocaleString('vi-VN')} VNĐ</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Trẻ em: </span>
                    <strong style={{ color: '#0f172a' }}>{estimatedChildPrice.toLocaleString('vi-VN')} VNĐ</strong>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>
                      ({hasCustomChildPrice ? 'tự nhập' : '60% giá bán'})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Em bé: </span>
                    <strong style={{ color: '#0f172a' }}>{estimatedBabyPrice.toLocaleString('vi-VN')} VNĐ</strong>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>
                      ({hasCustomBabyPrice ? 'tự nhập' : '20% giá bán'})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Ảnh đại diện */}
            <div className="form-group">
              <label className="form-label">Ảnh đại diện</label>
              <ImageUploader
                value={formData.main_image}
                onChange={(url, publicId) =>
                  setFields({ main_image: url, main_image_public_id: publicId || '' })
                }
              />
            </div>

            {/* Thư viện ảnh gallery */}
            <div className="form-group">
              <label className="form-label">Thư viện ảnh (Gallery - chọn cùng lúc tối đa 5 ảnh)</label>
              <ImageUploader
                multiple={true}
                maxBatch={5}
                images={formData.gallery || []}
                publicIds={formData.gallery_public_ids || []}
                onImagesChange={(urls, publicIds) =>
                  setFields({ gallery: urls, gallery_public_ids: publicIds })
                }
              />
            </div>

            {/* Điểm nổi bật của tour */}
            <div className="form-group">
              <label className="form-label">Điểm nổi bật của tour (mỗi dòng 1 điểm nhấn)</label>
              <textarea
                name="highlights"
                className="form-control"
                rows="4"
                placeholder="Khám phá các danh thắng nổi tiếng tại điểm đến&#10;Thưởng thức đặc sản vùng miền phong phú&#10;Khách sạn tiêu chuẩn tiện nghi trung tâm"
                value={Array.isArray(formData.highlights) ? formData.highlights.join('\n') : (formData.highlights || '')}
                onChange={(e) => setField('highlights', e.target.value)}
              />
              <small style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                Mỗi dòng sẽ hiển thị thành một gạch đầu dòng trong mục Điểm nổi bật ở trang chi tiết tour.
              </small>
            </div>

            {/* Thông tin tour chi tiết (HTML) */}
            <div className="form-group">
              <label className="form-label">Nội dung chi tiết (Mô tả)</label>
              <textarea name="content_html" className="form-control" rows="6" placeholder="Nhập nội dung chi tiết..." value={formData.content_html} onChange={handleChange} />
            </div>

            {/* Dịch vụ bao gồm & không bao gồm */}
            <div className="form-row">
              <div className="form-group form-col">
                <label className="form-label">Dịch vụ bao gồm (mỗi dòng 1 dịch vụ)</label>
                <textarea
                  name="services_included"
                  className="form-control"
                  rows="4"
                  placeholder="Vé máy bay khứ hồi&#10;Khách sạn 4 sao&#10;Các bữa ăn theo lịch trình"
                  value={Array.isArray(formData.services_included) ? formData.services_included.join('\n') : (formData.services_included || '')}
                  onChange={(e) => setField('services_included', e.target.value)}
                />
              </div>
              <div className="form-group form-col">
                <label className="form-label">Dịch vụ không bao gồm (mỗi dòng 1 dịch vụ)</label>
                <textarea
                  name="services_excluded"
                  className="form-control"
                  rows="4"
                  placeholder="Chi phí cá nhân&#10;Tiền tip hướng dẫn viên&#10;VAT"
                  value={Array.isArray(formData.services_excluded) ? formData.services_excluded.join('\n') : (formData.services_excluded || '')}
                  onChange={(e) => setField('services_excluded', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Điều kiện đặc biệt (hộ chiếu, visa, lưu ý khác)</label>
              <textarea
                name="special_conditions"
                className="form-control"
                rows="3"
                placeholder="Hộ chiếu còn hạn trên 6 tháng..."
                value={formData.special_conditions || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lưu ý cho khách hàng</label>
              <textarea
                name="notes"
                className="form-control"
                rows="3"
                placeholder="Nhập các lưu ý về trang phục, chuẩn bị cá nhân, thời tiết..."
                value={formData.notes || ''}
                onChange={handleChange}
              />
            </div>

            {/* Lịch trình tour */}
            <div className="form-group">
              <label className="form-label">Lịch trình tour</label>
              <ItineraryEditor items={formData.itinerary} onChange={(items) => setField('itinerary', items)} />
            </div>

            {/* Nút hành động */}
            <div className="form-actions" style={{ marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Save size={18} style={{ marginRight: '6px' }} />
                <span>{submitting ? 'Đang xử lý...' : isEdit ? 'Cập nhật Tour' : 'Tạo Tour'}</span>
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
