import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Send, Search, Clock, Inbox, CheckCircle, RefreshCw } from 'lucide-react';
import articleService, { ARTICLE_STATUS_MAP } from '../articleService';
import ArticleReviewActionModal from '../components/ArticleReviewActionModal';
import ArticleHistoryModal from '../components/ArticleHistoryModal';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
  ActionButtons,
  StatusBadge,
} from '../../..//components/common';

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

function Articles() {
  const { perms, isAdmin } = getStoredPermissions();
  const hasPerm = (p) => isAdmin || perms.includes(p);

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await articleService.getActiveCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await articleService.getArticles({
        page,
        limit: 10,
        search,
        status,
        category_id: categoryId,
      });
      setArticles(res.data?.articles || []);
      setPagination(res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, categoryId]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setCategoryId('');
    setPage(1);
  };

  const handleSubmitForReview = async (art) => {
    if (!window.confirm(`Gửi bài viết "${art.title}" sang hàng đợi phê duyệt?`)) return;
    try {
      await articleService.submitForReview(art._id);
      setSuccess('Đã gửi bài viết sang hàng đợi duyệt');
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Gửi duyệt thất bại');
    }
  };

  const handleDelete = async (art) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${art.title}"?`)) return;
    try {
      await articleService.deleteArticle(art._id);
      setSuccess('Xóa bài viết thành công');
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa bài viết thất bại');
    }
  };

  const columns = [
    {
      key: 'cover_image',
      title: 'Ảnh',
      width: '80px',
      align: 'center',
      render: (art) =>
        art.cover_image?.url ? (
          <img
            src={art.cover_image.url}
            alt=""
            style={{ width: '60px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
          />
        ) : (
          <div
            style={{
              width: '60px',
              height: '42px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            No img
          </div>
        ),
    },
    {
      key: 'title_summary',
      title: 'Tiêu đề & Tóm tắt',
      render: (art) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{art.title}</div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              maxWidth: '380px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {art.summary || 'Chưa có tóm tắt'}
          </div>
          {art.review_comment && art.status === 'CHANGES_REQUESTED' && (
            <div style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '4px', fontWeight: 500 }}>
              ⚠️ Phản hồi: {art.review_comment}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục',
      width: '150px',
      render: (art) => (
        <span
          style={{
            padding: '3px 8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {art.category_id?.name || 'Chung'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '140px',
      align: 'center',
      render: (art) => <StatusBadge status={art.status} statusMap={ARTICLE_STATUS_MAP} />,
    },
    {
      key: 'view_count',
      title: 'Lượt xem',
      width: '90px',
      align: 'center',
      render: (art) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{art.view_count || 0}</span>
      ),
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      width: '120px',
      render: (art) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {new Date(art.created_at).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '180px',
      align: 'center',
      render: (art) => (
        <div className="action-btns" style={{ justifyContent: 'center' }}>
          {/* Lịch sử duyệt */}
          <button
            type="button"
            className="icon-btn"
            title="Lịch sử duyệt bài"
            onClick={() => {
              setSelectedArticle(art);
              setShowHistoryModal(true);
            }}
          >
            <Clock size={16} />
          </button>

          {/* Xem trên web */}
          {art.status === 'PUBLISHED' && (
            <a
              href={`/tin-tuc/${art.slug}`}
              target="_blank"
              rel="noreferrer"
              className="icon-btn view"
              title="Xem trên website"
            >
              <Eye size={16} />
            </a>
          )}

          {/* Gửi duyệt */}
          {['DRAFT', 'CHANGES_REQUESTED'].includes(art.status) && hasPerm('article.update') && (
            <button
              type="button"
              className="icon-btn"
              title="Gửi duyệt bài"
              onClick={() => handleSubmitForReview(art)}
              style={{ color: '#d97706' }}
            >
              <Send size={16} />
            </button>
          )}

          {/* Phê duyệt nhanh */}
          {art.status === 'PENDING_REVIEW' && hasPerm('article.review') && (
            <button
              type="button"
              className="icon-btn"
              title="Phê duyệt bài"
              onClick={() => {
                setSelectedArticle(art);
                setActionType('APPROVE');
                setShowActionModal(true);
              }}
              style={{ color: '#16a34a' }}
            >
              <CheckCircle size={16} />
            </button>
          )}

          {/* Xuất bản */}
          {art.status === 'APPROVED' && hasPerm('article.publish') && (
            <button
              type="button"
              className="icon-btn"
              title="Xuất bản ngay"
              onClick={() => {
                setSelectedArticle(art);
                setActionType('PUBLISH');
                setShowActionModal(true);
              }}
              style={{ color: '#2563eb' }}
            >
              <Send size={16} />
            </button>
          )}

          {/* Sửa bài */}
          {hasPerm('article.update') && (
            <Link
              to={`/admin/articles/edit/${art._id}`}
              className="icon-btn edit"
              title="Chỉnh sửa bài viết"
            >
              <Edit2 size={16} />
            </Link>
          )}

          {/* Xóa bài */}
          {hasPerm('article.manage') && (
            <button
              type="button"
              className="icon-btn delete"
              title="Xóa bài viết"
              onClick={() => handleDelete(art)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="articles-management-page pb-4">
      <AdminPageHeader
        title="Quản lý Tin tức Du lịch"
        subtitle="Biên tập, phê duyệt và xuất bản các bài viết trên hệ thống"
        actions={
          <>
            <button className="btn btn-secondary" onClick={fetchArticles} title="Làm mới danh sách">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Làm mới</span>
            </button>
            {hasPerm('article.review') && (
              <Link to="/admin/articles/review-queue" className="btn btn-secondary" title="Hàng đợi duyệt bài">
                <Inbox size={16} style={{ color: '#d97706' }} />
                <span>Hàng đợi duyệt bài</span>
              </Link>
            )}
            {hasPerm('article.create') && (
              <Link to="/admin/articles/create" className="btn btn-primary">
                <Plus size={18} />
                <span>Soạn bài viết mới</span>
              </Link>
            )}
          </>
        }
      />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3">{success}</Alert>}

      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Tìm kiếm theo tiêu đề bài viết..."
        filters={[
          {
            key: 'category',
            value: categoryId,
            onChange: (val) => {
              setCategoryId(val);
              setPage(1);
            },
            placeholder: '-- Tất cả danh mục --',
            options: categories.map((c) => ({ value: c._id, label: c.name })),
            width: '200px',
          },
          {
            key: 'status',
            value: status,
            onChange: (val) => {
              setStatus(val);
              setPage(1);
            },
            placeholder: '-- Tất cả trạng thái --',
            options: [
              { value: 'DRAFT', label: 'Bản nháp' },
              { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
              { value: 'CHANGES_REQUESTED', label: 'Cần chỉnh sửa' },
              { value: 'APPROVED', label: 'Đã phê duyệt' },
              { value: 'PUBLISHED', label: 'Đã xuất bản' },
              { value: 'ARCHIVED', label: 'Lưu trữ' },
            ],
            width: '180px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      <AdminDataTable
        columns={columns}
        data={articles}
        loading={loading}
        emptyText="Chưa có bài viết nào phù hợp."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Modals */}
      {showActionModal && (
        <ArticleReviewActionModal
          show={showActionModal}
          onHide={() => setShowActionModal(false)}
          article={selectedArticle}
          actionType={actionType}
          onSuccess={() => {
            fetchArticles();
            setShowActionModal(false);
          }}
        />
      )}

      {showHistoryModal && (
        <ArticleHistoryModal
          show={showHistoryModal}
          onHide={() => setShowHistoryModal(false)}
          articleId={selectedArticle?._id}
        />
      )}
    </div>
  );
}

export default Articles;
