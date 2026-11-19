import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Badge, Spinner, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Search, Flame, TrendingUp, Compass, Calendar, ArrowRight } from 'lucide-react';
import articleService from '../modules/article/articleService';
import ArticleCard from '../modules/article/components/ArticleCard';

function ArticleListPage() {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchCategories = async () => {
    try {
      const res = await articleService.getActiveCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Không thể tải danh mục:', err);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await articleService.getFeaturedArticles(5);
      setFeaturedArticles(res.data || []);
    } catch (err) {
      console.error('Không thể tải bài nổi bật:', err);
    }
  };

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await articleService.getPublishedArticles({
        page,
        limit: 9,
        category: selectedCategory,
        search: appliedSearch,
      });
      setArticles(res.data?.articles || []);
      setPagination(res.data?.pagination || { page: 1, limit: 9, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Không thể tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, appliedSearch]);

  useEffect(() => {
    fetchCategories();
    fetchFeatured();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchKeyword.trim());
    setPage(1);
  };

  const heroArticle = featuredArticles.length > 0 ? featuredArticles[0] : null;

  return (
    <div className="article-list-page pb-5" style={{ backgroundColor: '#f8fafc' }}>
      {/* 1. Hero Banner */}
      <div
        className="article-hero-banner text-white py-5 mb-4 position-relative"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #ea580c 100%)',
          minHeight: '260px',
        }}
      >
        <Container className="py-3 text-center position-relative" style={{ zIndex: 2 }}>
          <Badge bg="warning" text="dark" className="px-3 py-2 mb-3 text-uppercase fw-bold">
            <Compass size={14} className="me-1" /> Cổng thông tin du lịch
          </Badge>
          <h1 className="fw-bold mb-3 display-6">Khám Phá & Trải Nghiệm Cùng TourBooking</h1>
          <p className="text-light-50 mx-auto mb-4" style={{ maxWidth: '640px', fontSize: '1.05rem', color: '#cbd5e1' }}>
            Tổng hợp tin tức, cẩm nang du lịch hữu ích, đánh giá khách sạn và gợi ý điểm đến hấp dẫn nhất cho chuyến đi của bạn.
          </p>

          <Form onSubmit={handleSearchSubmit} className="mx-auto" style={{ maxWidth: '540px' }}>
            <div className="d-flex bg-white rounded-pill p-1 shadow-lg">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm bài viết, cẩm nang, điểm đến..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="border-0 rounded-pill px-3 shadow-none"
              />
              <Button type="submit" variant="primary" className="rounded-pill px-4 fw-semibold" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                <Search size={16} className="me-1" /> Tìm
              </Button>
            </div>
          </Form>
        </Container>
      </div>

      <Container>
        {/* 2. Category Filter Pills */}
        <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
          <Button
            size="sm"
            variant={selectedCategory === '' ? 'primary' : 'outline-secondary'}
            className="rounded-pill px-3"
            style={selectedCategory === '' ? { backgroundColor: '#ea580c', borderColor: '#ea580c' } : {}}
            onClick={() => {
              setSelectedCategory('');
              setPage(1);
            }}
          >
            Tất cả chủ đề
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat._id}
              size="sm"
              variant={selectedCategory === cat.slug ? 'primary' : 'outline-secondary'}
              className="rounded-pill px-3"
              style={selectedCategory === cat.slug ? { backgroundColor: '#ea580c', borderColor: '#ea580c' } : {}}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setPage(1);
              }}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* 3. Hero Article (Bài nổi bật) */}
        {!selectedCategory && !appliedSearch && heroArticle && page === 1 && (
          <div className="mb-5 bg-white rounded-4 shadow-sm overflow-hidden border">
            <Row className="g-0 align-items-center">
              <Col lg={7}>
                <Link to={`/tin-tuc/${heroArticle.slug}`} className="d-block overflow-hidden" style={{ maxHeight: '380px' }}>
                  <img
                    src={heroArticle.cover_image?.url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'}
                    alt={heroArticle.title}
                    className="w-100 h-100 object-fit-cover hover-zoom"
                    style={{ minHeight: '340px' }}
                  />
                </Link>
              </Col>
              <Col lg={5} className="p-4 p-lg-5">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Badge bg="danger" className="d-flex align-items-center gap-1 text-uppercase">
                    <Flame size={13} /> Nổi bật
                  </Badge>
                  {heroArticle.category_id?.name && (
                    <Badge bg="light" text="dark" className="border">
                      {heroArticle.category_id.name}
                    </Badge>
                  )}
                </div>
                <h3 className="fw-bold mb-3">
                  <Link to={`/tin-tuc/${heroArticle.slug}`} className="text-decoration-none text-dark hover-orange">
                    {heroArticle.title}
                  </Link>
                </h3>
                <p className="text-muted mb-4 line-clamp-3">
                  {heroArticle.summary || 'Khám phá ngay bài viết nổi bật được cộng đồng du lịch quan tâm nhiều nhất...'}
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small d-flex align-items-center gap-1">
                    <Calendar size={13} /> {new Date(heroArticle.published_at).toLocaleDateString('vi-VN')}
                  </span>
                  <Link to={`/tin-tuc/${heroArticle.slug}`} className="btn btn-outline-dark btn-sm rounded-pill px-3">
                    Đọc bài viết <ArrowRight size={14} className="ms-1" />
                  </Link>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* 4. Main Content: Grid + Sidebar */}
        <Row>
          <Col lg={8}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                {appliedSearch ? `Kết quả tìm kiếm cho "${appliedSearch}"` : 'Bài viết mới nhất'}
              </h5>
              <span className="text-muted small">{pagination.total} bài viết</span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#ea580c' }} />
                <p className="mt-2 text-muted">Đang tải tin tức...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm p-4">
                <p className="text-muted mb-2">Không tìm thấy bài viết nào phù hợp.</p>
                <Button size="sm" variant="outline-primary" onClick={() => { setSelectedCategory(''); setAppliedSearch(''); setSearchKeyword(''); }}>
                  Xem tất cả bài viết
                </Button>
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {articles.map((art) => (
                    <Col key={art._id} md={6}>
                      <ArticleCard article={art} />
                    </Col>
                  ))}
                </Row>

                {pagination.totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-5">
                    <Pagination>
                      <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                        <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
                          {p}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next disabled={page === pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Col>

          {/* Sidebar */}
          <Col lg={4} className="mt-4 mt-lg-0">
            {/* Top bài đọc nhiều */}
            <div className="bg-white rounded-3 p-4 shadow-sm border mb-4">
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <TrendingUp size={18} color="#ea580c" /> Đọc nhiều nhất
              </h6>
              {featuredArticles.length === 0 ? (
                <small className="text-muted">Đang cập nhật...</small>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {featuredArticles.slice(0, 5).map((art, idx) => (
                    <div key={art._id} className="d-flex gap-3 align-items-start">
                      <span className="fw-bold fs-5 text-muted" style={{ width: '20px', color: idx < 3 ? '#ea580c' : '#94a3b8' }}>
                        0{idx + 1}
                      </span>
                      <div className="flex-grow-1">
                        <Link to={`/tin-tuc/${art.slug}`} className="text-decoration-none text-dark fw-semibold small hover-orange line-clamp-2">
                          {art.title}
                        </Link>
                        <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                          {art.view_count || 0} lượt đọc
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chủ đề du lịch */}
            <div className="bg-white rounded-3 p-4 shadow-sm border">
              <h6 className="fw-bold mb-3 pb-2 border-bottom">Chủ đề khám phá</h6>
              <div className="d-flex flex-column gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    className="btn btn-link text-start text-decoration-none text-dark p-1 d-flex justify-content-between align-items-center hover-orange"
                    onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  >
                    <span>{cat.name}</span>
                    <span className="text-muted small">→</span>
                  </button>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ArticleListPage;
