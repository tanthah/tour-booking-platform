import { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { Image as ImageIcon } from 'lucide-react';
import articleService from '../articleService';

function ArticleSidebar({ formData, setFormData, categories }) {
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingCover(true);
      const res = await articleService.uploadImage(file);
      const url = res.data?.url || res.url;
      setFormData((prev) => ({
        ...prev,
        cover_image: {
          ...prev.cover_image,
          url,
          alt: file.name.replace(/\.[^/.]+$/, ''),
        },
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Upload ảnh bìa thất bại');
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <aside className="article-sidebar">
      {/* Cài đặt danh mục & từ khóa */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Header className="bg-white fw-bold">Cài đặt bài viết</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Danh mục <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={formData.category_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Tags (Từ khóa)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Cách nhau bởi dấu phẩy, vd: Đà Nẵng, ẩm thực"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
            />
          </Form.Group>

          <Form.Check
            type="checkbox"
            id="is_featured"
            label="Đặt làm bài viết nổi bật"
            checked={formData.is_featured}
            onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
          />
        </Card.Body>
      </Card>

      {/* Ảnh bìa */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Header className="bg-white fw-bold">Ảnh bìa bài viết</Card.Header>
        <Card.Body>
          {formData.cover_image?.url ? (
            <div className="text-center mb-2">
              <img
                src={formData.cover_image.url}
                alt={formData.cover_image.alt || 'Ảnh bìa'}
                className="img-fluid rounded border"
                style={{ maxHeight: '180px', width: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed rounded bg-light mb-2">
              <ImageIcon size={32} className="text-muted mb-1" />
              <p className="small text-muted mb-0">Chưa có ảnh bìa</p>
            </div>
          )}
          <Form.Control
            type="file"
            accept="image/*"
            disabled={uploadingCover}
            onChange={(e) => handleCoverUpload(e.target.files[0])}
            className="mb-2"
          />
          {uploadingCover && <small className="text-primary d-block mb-2">Đang tải ảnh bìa...</small>}
          <Form.Control
            size="sm"
            type="text"
            placeholder="Ghi chú ảnh bìa..."
            value={formData.cover_image.caption || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cover_image: { ...prev.cover_image, caption: e.target.value },
              }))
            }
          />
        </Card.Body>
      </Card>

      {/* Nguồn bài viết */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Header className="bg-white fw-bold">Loại nguồn bài viết</Card.Header>
        <Card.Body>
          <div className="d-flex gap-3 mb-3">
            <Form.Check
              type="radio"
              id="source_original"
              name="source_type"
              label="Tự biên tập"
              checked={formData.content_source_type === 'original'}
              onChange={() => setFormData((prev) => ({ ...prev, content_source_type: 'original' }))}
            />
            <Form.Check
              type="radio"
              id="source_curated"
              name="source_type"
              label="Tổng hợp"
              checked={formData.content_source_type === 'curated'}
              onChange={() => setFormData((prev) => ({ ...prev, content_source_type: 'curated' }))}
            />
          </div>

          {formData.content_source_type === 'curated' && (
            <div>
              <small className="text-muted d-block mb-2">Nguồn tham khảo:</small>
              {formData.sources.map((src, i) => (
                <div key={i} className="mb-2 p-2 border rounded bg-light">
                  <Form.Control
                    size="sm"
                    placeholder="Tên nguồn (vd: Báo Tuổi Trẻ)"
                    className="mb-1"
                    value={src.title}
                    onChange={(e) => {
                      const next = [...formData.sources];
                      next[i].title = e.target.value;
                      setFormData((prev) => ({ ...prev, sources: next }));
                    }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Đường link (URL)"
                    value={src.url}
                    onChange={(e) => {
                      const next = [...formData.sources];
                      next[i].url = e.target.value;
                      setFormData((prev) => ({ ...prev, sources: next }));
                    }}
                  />
                </div>
              ))}
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    sources: [...prev.sources, { title: '', url: '', author: '' }],
                  }))
                }
              >
                + Thêm nguồn
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </aside>
  );
}

export default ArticleSidebar;
