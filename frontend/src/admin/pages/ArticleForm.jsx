import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft, Save, Send, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import articleService from '../modules/article/articleService';
import ArticleEditor from '../modules/article/components/ArticleEditor';
import ArticleSidebar from '../modules/article/components/ArticleSidebar';
import ArticleStatusBadge from '../components/ArticleStatusBadge';
import ArticleReviewActionModal from '../modules/article/components/ArticleReviewActionModal';
import ArticleHistoryModal from '../modules/article/components/ArticleHistoryModal';

function getStoredPermissions() {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    const isAdmin = user.role?.code === 'admin' || (Array.isArray(user.roles) && user.roles.includes('ADMIN'));
    return { perms, isAdmin };
  } catch {
    return { perms: [], isAdmin: false };
  }
}

function ArticleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { perms, isAdmin } = getStoredPermissions();
  const hasPerm = (p) => isAdmin || perms.includes(p);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals for Review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewActionType, setReviewActionType] = useState('APPROVE');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
    review_comment: '',
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
        review_comment: art.review_comment || '',
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
        status: targetStatus || formData.status,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        sources: formData.content_source_type === 'curated'
          ? formData.sources.filter((s) => s.title.trim() || s.url.trim())
          : [],
      };

      if (isEdit) {
        await articleService.updateArticle(id, payload);
        setSuccess('Đã lưu các thay đổi bài viết');
      } else {
        const created = await articleService.createArticle(payload);
        navigate(`/admin/articles/edit/${created.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu bài viết thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setError('');
    if (!formData.cover_image?.url) {
      setError('Ảnh bìa là bắt buộc trước khi gửi duyệt bài');
      return;
    }
    try {
      setSaving(true);
      // Lưu nội dung trước
      await handleSave('DRAFT');
      await articleService.submitForReview(id);
      setSuccess('Đã gửi bài viết sang hàng đợi chờ duyệt');
      fetchArticle();
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi duyệt thất bại');
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
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/admin/articles" className="btn btn-outline-secondary btn-sm">
            <ArrowLeft size={16} /> Quay lại
          </Link>
          <h4 className="mb-0 fw-bold">{isEdit ? 'Chỉnh sửa bài viết' : 'Soạn bài viết mới'}</h4>
          {isEdit && <ArticleStatusBadge status={formData.status} />}
        </div>
        <div className="d-flex gap-2">
          {isEdit && (
            <Button variant="outline-secondary" size="sm" onClick={() => setShowHistoryModal(true)}>
              <Clock size={16} className="me-1" /> Lịch sử
            </Button>
          )}
          <Button variant="outline-primary" size="sm" disabled={saving} onClick={() => handleSave('DRAFT')}>
            <Save size={16} className="me-1" /> Lưu bản nháp
          </Button>

          {/* Gửi duyệt */}
          {isEdit && ['DRAFT', 'CHANGES_REQUESTED'].includes(formData.status) && (
            <Button variant="warning" size="sm" disabled={saving} onClick={handleSubmitForReview}>
              <Send size={16} className="me-1" /> Gửi duyệt bài
            </Button>
          )}

          {/* Phê duyệt / Yêu cầu sửa nếu có quyền review */}
          {isEdit && formData.status === 'PENDING_REVIEW' && hasPerm('article.review') && (
            <>
              <Button variant="outline-danger" size="sm" onClick={() => { setReviewActionType('REQUEST_CHANGES'); setShowReviewModal(true); }}>
                <AlertTriangle size={16} className="me-1" /> Yêu cầu sửa
              </Button>
              <Button variant="success" size="sm" onClick={() => { setReviewActionType('APPROVE'); setShowReviewModal(true); }}>
                <CheckCircle size={16} className="me-1" /> Phê duyệt
              </Button>
            </>
          )}

          {/* Xuất bản */}
          {hasPerm('article.publish') && (formData.status === 'APPROVED' || isAdmin) && (
            <Button variant="primary" size="sm" disabled={saving} onClick={() => handleSave('PUBLISHED')}>
              <Send size={16} className="me-1" /> Xuất bản ngay
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Banner thông báo cần sửa */}
      {formData.status === 'CHANGES_REQUESTED' && formData.review_comment && (
        <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3 shadow-sm">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <strong>Yêu cầu chỉnh sửa từ ban biên tập:</strong> {formData.review_comment}
          </div>
        </Alert>
      )}

      {/* Banner thông báo đang chờ duyệt */}
      {formData.status === 'PENDING_REVIEW' && (
        <Alert variant="warning" className="d-flex align-items-center gap-2 mb-3 shadow-sm">
          <Clock size={20} className="flex-shrink-0" />
          <div>Bài viết đang nằm trong hàng đợi chờ phê duyệt.</div>
        </Alert>
      )}

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
                <Form.Label className="fw-bold">Tóm tắt (Sapo) <span className="text-danger">*</span></Form.Label>
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
          <ArticleSidebar formData={formData} setFormData={setFormData} categories={categories} />
        </Col>
      </Row>

      <ArticleReviewActionModal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        article={{ _id: id, title: formData.title, summary: formData.summary }}
        actionType={reviewActionType}
        onSuccess={(msg) => { setSuccess(msg); fetchArticle(); }}
      />

      <ArticleHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        article={{ _id: id, title: formData.title }}
      />
    </div>
  );
}

export default ArticleForm;
