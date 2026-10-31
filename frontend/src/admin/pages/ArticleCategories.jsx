import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Form, Modal, Card, Spinner, Alert } from 'react-bootstrap';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import articleService from '../modules/article/articleService';

function ArticleCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalForm, setModalForm] = useState({ name: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await articleService.getCategories();
      setCategories(res.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      setModalForm({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active ?? true,
      });
    } else {
      setModalForm({ name: '', description: '', is_active: true });
    }
    setShowModal(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return;

    try {
      setSubmitting(true);
      if (editingCategory) {
        await articleService.updateCategory(editingCategory._id, modalForm);
        setSuccess('Cập nhật danh mục thành công');
      } else {
        await articleService.createCategory(modalForm);
        setSuccess('Tạo danh mục mới thành công');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu danh mục thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await articleService.toggleCategoryStatus(category._id, !category.is_active);
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) return;
    try {
      await articleService.deleteCategory(category._id);
      setSuccess('Xóa danh mục thành công');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa danh mục thất bại');
    }
  };

  return (
    <div className="article-categories-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold mb-0">Quản lý Danh mục Tin tức</h4>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={16} className="me-1" /> Thêm danh mục
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Tên danh mục</th>
                  <th>Slug URL</th>
                  <th>Mô tả</th>
                  <th style={{ width: '130px' }}>Trạng thái</th>
                  <th style={{ width: '130px' }} className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Chưa có danh mục tin tức nào
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr key={cat._id}>
                      <td>{index + 1}</td>
                      <td className="fw-semibold text-dark">{cat.name}</td>
                      <td>
                        <code>{cat.slug}</code>
                      </td>
                      <td className="text-muted small" style={{ maxWidth: '280px' }}>
                        {cat.description || '—'}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant={cat.is_active ? 'outline-success' : 'outline-secondary'}
                          className="py-0 px-2 d-inline-flex align-items-center gap-1"
                          onClick={() => handleToggleStatus(cat)}
                        >
                          {cat.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          <span style={{ fontSize: '12px' }}>
                            {cat.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                          </span>
                        </Button>
                      </td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1 p-1"
                          onClick={() => handleOpenModal(cat)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="p-1"
                          onClick={() => handleDelete(cat)}
                          title="Xóa danh mục"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Thêm / Sửa Danh mục */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSaveModal}>
          <Modal.Header closeButton>
            <Modal.Title className="h5">
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Tên danh mục <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="VD: Kinh nghiệm du lịch"
                value={modalForm.name}
                required
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mô tả ngắn</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Mô tả về chủ đề của danh mục này..."
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              id="category_active_check"
              label="Kích hoạt hoạt động"
              checked={modalForm.is_active}
              onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu danh mục'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default ArticleCategories;
