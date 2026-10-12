import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

/**
 * ImageUploader Component - Upload ảnh lên Cloudinary qua Backend API
 * Hỗ trợ upload đơn và nhiều ảnh, xóa ảnh, hiển thị preview
 * @param {string} value - URL ảnh hiện tại (dùng cho upload đơn)
 * @param {Function} onChange - Callback khi URL ảnh thay đổi
 * @param {boolean} multiple - Cho phép upload nhiều ảnh
 * @param {string[]} images - Danh sách URL ảnh (dùng khi multiple=true)
 * @param {Function} onImagesChange - Callback khi danh sách ảnh thay đổi
 */
const ImageUploader = ({ value, onChange, multiple = false, images = [], onImagesChange }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Xử lý upload ảnh lên Cloudinary qua API /api/upload/image
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      if (multiple) {
        // Upload nhiều ảnh cùng lúc
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('images', file));
        const res = await axiosAdmin.post('/upload/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res?.success && res.data) {
          const newUrls = res.data.map((item) => item.url);
          onImagesChange?.([...images, ...newUrls]);
        }
      } else {
        // Upload 1 ảnh
        const formData = new FormData();
        formData.append('image', files[0]);
        const res = await axiosAdmin.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res?.success && res.data) {
          onChange?.(res.data.url);
        }
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
      // Reset input file để cho phép chọn lại cùng file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Xóa ảnh đơn
  const handleRemoveSingle = () => {
    onChange?.('');
  };

  // Xóa 1 ảnh trong danh sách
  const handleRemoveFromList = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange?.(updated);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      {/* Chế độ upload đơn */}
      {!multiple && (
        <div className="img-upload-area">
          {value ? (
            <div className="img-preview-wrapper">
              <img src={value} alt="Preview" className="img-preview" />
              <button type="button" className="img-remove-btn" onClick={handleRemoveSingle}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="img-add-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <span className="img-uploading-text">Đang tải...</span>
              ) : (
                <Plus size={28} />
              )}
            </button>
          )}
        </div>
      )}

      {/* Chế độ upload nhiều ảnh */}
      {multiple && (
        <div className="img-gallery-grid">
          {images.map((url, idx) => (
            <div key={idx} className="img-preview-wrapper">
              <img src={url} alt={`Gallery ${idx + 1}`} className="img-preview" />
              <button type="button" className="img-remove-btn" onClick={() => handleRemoveFromList(idx)}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="img-add-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <span className="img-uploading-text">Đang tải...</span>
            ) : (
              <Plus size={28} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

