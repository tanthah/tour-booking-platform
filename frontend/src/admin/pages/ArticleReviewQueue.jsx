import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Form, Card, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Eye, Edit, Search, Inbox, ArrowLeft } from 'lucide-react';
import articleService from '../modules/article/articleService';
import ArticleReviewActionModal from '../modules/article/components/ArticleReviewActionModal';
import ArticleHistoryModal from '../modules/article/components/ArticleHistoryModal';

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

  const handleOpenAction = (article, type) => {
    setSelectedArticle(article);
    setActionType(type);
    setShowActionModal(true);
  };

  return (
    <div className="article-review-queue-page pb-5">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/admin/articles" className="btn btn-outline-secondary btn-sm">
            <ArrowLeft size={16} /> Danh sách bài viết
          </Link>
          <div>
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Inbox size={22} className="text-warning" /> Hàng đợi duyệt bài
              <Badge bg="warning" text="dark" pill className="fs-6">
                {pagination.total}
              </Badge>
            </h4>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filter Card */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Body className="p-3">
          <Row className="g-2">
            <Col md={7}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề bài viết..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pe-4"
                />
                <Search size={16} className="position-absolute end-0 top-50 translate-middle-y me-2 text-muted" />
              </div>
            </Col>
            <Col md={5}>
              <Form.Select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">-- Tất cả danh mục --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Queue Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="warning" />
              <p className="mt-2 text-muted small">Đang tải hàng đợi duyệt...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '80px' }}>Ảnh</th>
                  <th>Tiêu đề & Tóm tắt</th>
                  <th style={{ width: '150px' }}>Danh mục</th>
                  <th style={{ width: '160px' }}>Tác giả</th>
                  <th style={{ width: '150px' }}>Thời gian gửi</th>
                  <th style={{ width: '200px' }} className="text-end">Hành động duyệt</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      🎉 Hàng đợi trống! Hiện tại không có bài viết nào cần duyệt.
                    </td>
                  </tr>
                ) : (
                  articles.map((art) => (
                    <tr key={art._id}>
                      <td>
                        {art.cover_image?.url ? (
                          <img
                            src={art.cover_image.url}
                            alt=""
                            className="rounded object-fit-cover border"
                            style={{ width: '64px', height: '48px' }}
                          />
                        ) : (
                          <div
                            className="rounded bg-light text-muted d-flex align-items-center justify-content-center border"
                            style={{ width: '64px', height: '48px', fontSize: '11px' }}
                          >
                            No img
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold text-dark mb-1">{art.title}</div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: '380px' }}>
                          {art.summary || 'Chưa có tóm tắt'}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="text-dark fw-normal">
                          {art.category_id?.name || 'Chung'}
                        </Badge>
                      </td>
                      <td className="small">
                        <div className="fw-semibold text-dark">{art.created_by?.full_name || 'N/A'}</div>
                        <div className="text-muted">{art.created_by?.email}</div>
                      </td>
                      <td className="text-muted small">
                        {art.submitted_at
                          ? new Date(art.submitted_at).toLocaleString('vi-VN')
                          : new Date(art.updated_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Link
                            to={`/admin/articles/edit/${art._id}`}
                            className="btn btn-sm btn-outline-secondary p-1"
                            title="Xem chi tiết & Soạn thảo"
                          >
                            <Eye size={15} />
                          </Link>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="p-1 px-2 d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenAction(art, 'REQUEST_CHANGES')}
                            title="Yêu cầu sửa"
                          >
                            <AlertTriangle size={14} /> Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            className="p-1 px-2 d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenAction(art, 'APPROVE')}
                            title="Phê duyệt"
                          >
                            <CheckCircle size={14} /> Duyệt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}

          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center p-3 border-top">
              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item
                    key={p}
                    active={p === page}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Xét duyệt */}
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

      {/* Modal Lịch sử */}
      <ArticleHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        article={selectedArticle}
      />
    </div>
  );
}

export default ArticleReviewQueue;
