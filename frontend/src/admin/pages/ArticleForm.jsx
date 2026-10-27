import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft, Save, Send } from 'lucide-react';
import articleService from '../modules/article/articleService';
import ArticleEditor from '../modules/article/components/ArticleEditor';
import ArticleSidebar from '../modules/article/components/ArticleSidebar';

function ArticleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    category_id: '',
    cover_image: { url: '', alt: '', caption: '' },
    content: [],
    content_source_type: 'original',
    sources: [{ title: '', url: '', author: '' }],
    tags: '',
    is_featured: false,
    status: 'DRAFT',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await articleService.getActiveCategories();
      setCategories(res.data || []);
      if (!isEdit && res.data?.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: prev.category_id || res.data[0]._id }));
      }
    } catch (err) {
      console.error('Không thể tải danh mục:', err);
    }
  }, [isEdit]);

  const fetchArticle = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await articleService.getArticleById(id);
      const art = res.data;
      setFormData({
        title: art.title || '',
        summary: art.summary || '',
        category_id: art.category_id?._id || art.category_id || '',
        cover_image: art.cover_image || { url: '', alt: '', caption: '' },
        content: Array.isArray(art.content) ? art.content : [],
        content_source_type: art.content_source_type || 'original',
        sources: art.sources?.length ? art.sources : [{ title: '', url: '', author: '' }],
        tags: Array.isArray(art.tags) ? art.tags.join(', ') : '',
        is_featured: Boolean(art.is_featured),
        status: art.status || 'DRAFT',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin bài viết');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategories();
    fetchArticle();
  }, [fetchCategories, fetchArticle]);

  const handleSave = async (targetStatus) => {
    setError('');
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề bài viết');
      return;
    }
    if (!formData.category_id) {
      setError('Vui lòng chọn danh mục bài viết');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        status: targetStatus,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        sources:
          formData.content_source_type === 'curated'
            ? formData.sources.filter((s) => s.title.trim() || s.url.trim())
            : [],
      };

      if (isEdit) {
        await articleService.updateArticle(id, payload);
      } else {
        await articleService.createArticle(payload);
      }
      navigate('/admin/articles');
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu bài viết thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải bài viết...</p>
      </div>
    );
  }

  return (
    <div className="article-form-page pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/admin/articles" className="btn btn-outline-secondary btn-sm">
            <ArrowLeft size={16} /> Quay lại
          </Link>
          <h4 className="mb-0 fw-bold">
            {isEdit ? 'Chỉnh sửa bài viết' : 'Soạn bài viết mới'}
          </h4>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            disabled={saving}
            onClick={() => handleSave('DRAFT')}
          >
            <Save size={16} className="me-1" /> Lưu bản nháp
          </Button>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => handleSave('PUBLISHED')}
          >
            <Send size={16} className="me-1" /> Xuất bản ngay
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row>
        <Col lg={8}>
          <Card className="mb-3 shadow-sm border-0">
            <Card.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Tiêu đề bài viết <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  size="lg"
                  type="text"
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Tóm tắt (Sapo)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Đoạn mở đầu tóm tắt nội dung bài viết..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                />
              </Form.Group>

              <div className="mb-2">
                <Form.Label className="fw-bold">Nội dung bài viết (Khối nội dung)</Form.Label>
                <ArticleEditor
                  blocks={formData.content}
                  onChange={(blocks) => setFormData({ ...formData, content: blocks })}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <ArticleSidebar
            formData={formData}
            setFormData={setFormData}
            categories={categories}
          />
        </Col>
      </Row>
    </div>
  );
}

export default ArticleForm;
