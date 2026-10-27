import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Form, Card, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Send, RotateCcw, Search } from 'lucide-react';
import articleService from '../modules/article/articleService';

function Articles() {
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

  const handleTogglePublish = async (article) => {
    const isPub = article.status === 'PUBLISHED';
    const actionText = isPub ? 'hạ bài viết về bản nháp' : 'xuất bản bài viết này';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText}?`)) return;

    try {
      await articleService.togglePublish(article._id, !isPub);
      setSuccess(isPub ? 'Đã chuyển về bản nháp' : 'Xuất bản bài viết thành công');
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}"?`)) return;
    try {
      await articleService.deleteArticle(article._id);
      setSuccess('Xóa bài viết thành công');
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa bài viết thất bại');
    }
  };

  return (
    <div className="articles-management-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Tin tức Du lịch</h4>
          <p className="text-muted small mb-0">Biên tập, quản lý và xuất bản các bài viết trên hệ thống</p>
        </div>
        <Link to="/admin/articles/create" className="btn btn-primary d-inline-flex align-items-center gap-1">
          <Plus size={16} /> Soạn bài viết mới
        </Link>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filter Card */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Body className="p-3">
          <Row className="g-2">
            <Col md={5}>
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
            <Col md={4}>
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
            <Col md={3}>
              <Form.Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="DRAFT">Bản nháp</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Articles Table */}
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
                  <th style={{ width: '80px' }}>Ảnh</th>
                  <th>Tiêu đề & Tóm tắt</th>
                  <th style={{ width: '150px' }}>Danh mục</th>
                  <th style={{ width: '100px' }} className="text-center">Lượt xem</th>
                  <th style={{ width: '130px' }} className="text-center">Trạng thái</th>
                  <th style={{ width: '140px' }}>Ngày tạo</th>
                  <th style={{ width: '160px' }} className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      Chưa có bài viết nào phù hợp điều kiện lọc
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
                      <td className="text-center text-muted small">
                        {art.view_count || 0}
                      </td>
                      <td className="text-center">
                        <Badge bg={art.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                          {art.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                        </Badge>
                      </td>
                      <td className="text-muted small">
                        {new Date(art.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {art.status === 'PUBLISHED' && (
                            <a
                              href={`/tin-tuc/${art.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-info p-1"
                              title="Xem bài viết trên web"
                            >
                              <Eye size={14} />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant={art.status === 'PUBLISHED' ? 'outline-warning' : 'outline-success'}
                            className="p-1"
                            onClick={() => handleTogglePublish(art)}
                            title={art.status === 'PUBLISHED' ? 'Gỡ về bản nháp' : 'Xuất bản'}
                          >
                            {art.status === 'PUBLISHED' ? <RotateCcw size={14} /> : <Send size={14} />}
                          </Button>
                          <Link
                            to={`/admin/articles/edit/${art._id}`}
                            className="btn btn-sm btn-outline-primary p-1"
                            title="Chỉnh sửa bài viết"
                          >
                            <Edit size={14} />
                          </Link>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="p-1"
                            onClick={() => handleDelete(art)}
                            title="Xóa bài viết"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}

          {/* Phân trang */}
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
    </div>
  );
}

export default Articles;
