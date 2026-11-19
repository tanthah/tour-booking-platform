import { useState, useEffect, useCallback } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import articleService from '../articleService';
import {
  AdminPageHeader,
  AdminDataTable,
  ActionButtons,
} from '../../..//components/common';

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
      setError('');
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

  const columns = [
    {
      key: 'name',
      title: 'Tên danh mục',
      render: (cat) => <span style={{ fontWeight: 600 }}>{cat.name}</span>,
    },
    {
      key: 'slug',
      title: 'Slug URL',
      render: (cat) => <code style={{ fontSize: '13px' }}>{cat.slug}</code>,
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (cat) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {cat.description || '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      title: 'Trạng thái',
      width: '140px',
      render: (cat) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(cat)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: cat.is_active ? '#dcfce7' : '#f1f5f9',
            color: cat.is_active ? '#166534' : '#475569',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          title="Bấm để bật/tắt hoạt động"
        >
          {cat.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
          <span>{cat.is_active ? 'Hoạt động' : 'Tạm ẩn'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '120px',
      align: 'center',
      render: (cat) => (
        <ActionButtons
          actions={[
            {
              key: 'edit',
              icon: Edit2,
              title: 'Chỉnh sửa danh mục',
              onClick: () => handleOpenModal(cat),
              variant: 'edit',
            },
            {
              key: 'delete',
              icon: Trash2,
              title: 'Xóa danh mục',
              onClick: () => handleDelete(cat),
              variant: 'delete',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="article-categories-page pb-4">
      <AdminPageHeader
        title="Quản lý Danh mục Tin tức"
        subtitle="Cấu hình danh mục bài viết, cẩm nang và kinh nghiệm du lịch"
        actions={
          <>
            <button className="btn btn-secondary" onClick={fetchCategories} title="Làm mới danh sách">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Làm mới</span>
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              <span>Thêm danh mục mới</span>
            </button>
          </>
        }
      />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3">{success}</Alert>}

      <AdminDataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyText="Chưa có danh mục tin tức nào."
      />

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
                required
                placeholder="VD: Cẩm nang du lịch, Điểm đến..."
                value={modalForm.name}
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mô tả ngắn</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Mô tả nội dung danh mục này..."
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Check
                type="switch"
                id="is-active-switch"
                label="Kích hoạt hiển thị công khai"
                checked={modalForm.is_active}
                onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default ArticleCategories;
