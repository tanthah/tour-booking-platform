import { useState, useEffect, useCallback } from 'react';
import { Badge, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Eye, Inbox, ArrowLeft, RefreshCw } from 'lucide-react';
import articleService from '../modules/article/articleService';
import ArticleReviewActionModal from '../modules/article/components/ArticleReviewActionModal';
import ArticleHistoryModal from '../modules/article/components/ArticleHistoryModal';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
} from '../components/common';

function ArticleReviewQueue() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
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

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await articleService.getReviewQueue({
        page,
        limit: 10,
        search,
        category_id: categoryId,
      });
      setArticles(res.data?.articles || []);
      setPagination(res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải hàng đợi duyệt');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setPage(1);
  };

  const handleOpenAction = (article, type) => {
    setSelectedArticle(article);
    setActionType(type);
    setShowActionModal(true);
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
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục',
      width: '140px',
      render: (art) => (
        <span
          style={{
            padding: '3px 8px',
            background: '#e0f2fe',
            color: '#0369a1',
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
      key: 'author',
      title: 'Tác giả',
      width: '180px',
      render: (art) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px' }}>{art.created_by?.full_name || 'N/A'}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{art.created_by?.email}</div>
        </div>
      ),
    },
    {
      key: 'submitted_at',
      title: 'Thời gian gửi',
      width: '150px',
      render: (art) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {art.submitted_at
            ? new Date(art.submitted_at).toLocaleString('vi-VN')
            : new Date(art.updated_at).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Hành động duyệt',
      width: '200px',
      align: 'center',
      render: (art) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
          <Link
            to={`/admin/articles/edit/${art._id}`}
            className="icon-btn view"
            title="Xem chi tiết & Soạn thảo"
          >
            <Eye size={16} />
          </Link>
          <Button
            size="sm"
            variant="outline-danger"
            className="py-1 px-2 d-inline-flex align-items-center gap-1"
            onClick={() => handleOpenAction(art, 'REQUEST_CHANGES')}
            title="Yêu cầu sửa"
            style={{ fontSize: '12px' }}
          >
            <AlertTriangle size={13} /> Sửa
          </Button>
          <Button
            size="sm"
            variant="success"
            className="py-1 px-2 d-inline-flex align-items-center gap-1"
            onClick={() => handleOpenAction(art, 'APPROVE')}
            title="Phê duyệt"
            style={{ fontSize: '12px' }}
          >
            <CheckCircle size={13} /> Duyệt
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="article-review-queue-page pb-4">
      <AdminPageHeader
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={24} className="text-warning" /> Hàng đợi duyệt bài
            <Badge bg="warning" text="dark" pill className="fs-6" style={{ marginLeft: '4px' }}>
              {pagination.total}
            </Badge>
          </span>
        }
        subtitle="Xem xét nội dung bài viết, yêu cầu biên tập viên chỉnh sửa hoặc phê duyệt xuất bản"
        actions={
          <>
            <Link to="/admin/articles" className="btn btn-secondary">
              <ArrowLeft size={16} /> <span>Quay lại</span>
            </Link>
            <button className="btn btn-secondary" onClick={fetchQueue} title="Làm mới hàng đợi">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} /> <span>Làm mới</span>
            </button>
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
            width: '220px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      <AdminDataTable
        columns={columns}
        data={articles}
        loading={loading}
        emptyText="🎉 Hàng đợi trống! Hiện tại không có bài viết nào cần duyệt."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Modal Xét duyệt */}
      {showActionModal && (
        <ArticleReviewActionModal
          show={showActionModal}
          onHide={() => setShowActionModal(false)}
          article={selectedArticle}
          actionType={actionType}
          onSuccess={(msg) => {
            setSuccess(msg);
            fetchQueue();
          }}
        />
      )}

      {showHistoryModal && (
        <ArticleHistoryModal
          show={showHistoryModal}
          onHide={() => setShowHistoryModal(false)}
          article={selectedArticle}
        />
      )}
    </div>
  );
}

export default ArticleReviewQueue;
