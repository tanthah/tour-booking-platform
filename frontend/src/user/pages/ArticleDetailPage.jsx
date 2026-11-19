import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Breadcrumb, Spinner, Card } from 'react-bootstrap';
import { Calendar, Eye, Clock, ExternalLink, Share2, Compass, ArrowLeft } from 'lucide-react';
import articleService from '../modules/article/articleService';
import ArticleContentRenderer from '../modules/article/components/ArticleContentRenderer';
import ArticleCard from '../modules/article/components/ArticleCard';

function ArticleDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchArticleDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await articleService.getArticleBySlug(slug);
        if (isMounted) {
          setArticle(res.data);
          // Fetch related articles
          const relRes = await articleService.getRelatedArticles(slug, 3);
          setRelatedArticles(relRes.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không tìm thấy bài viết');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticleDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="text-center py-5 my-5">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
        <p className="mt-2 text-muted">Đang tải bài viết...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <Container className="py-5 text-center">
        <h4 className="fw-bold mb-3">{error || 'Bài viết không tồn tại hoặc đã bị gỡ'}</h4>
        <Link to="/tin-tuc" className="btn btn-primary rounded-pill px-4">
          <ArrowLeft size={16} className="me-1" /> Quay lại trang tin tức
        </Link>
      </Container>
    );
  }

  const readingTime = Math.max(
    2,
    Math.ceil(((article.summary || '').length + (article.title || '').length * 5) / 120)
  );

  return (
    <div className="article-detail-page pb-5" style={{ backgroundColor: '#ffffff' }}>
      {/* 1. Breadcrumb */}
      <div className="bg-light py-2 border-bottom mb-4">
        <Container>
          <Breadcrumb className="mb-0 small">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/tin-tuc' }}>Tin tức</Breadcrumb.Item>
            {article.category_id?.name && (
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/tin-tuc?category=${article.category_id.slug}` }}>
                {article.category_id.name}
              </Breadcrumb.Item>
            )}
            <Breadcrumb.Item active className="text-truncate" style={{ maxWidth: '300px' }}>
              {article.title}
            </Breadcrumb.Item>
          </Breadcrumb>
        </Container>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col lg={9} xl={8}>
            {/* 2. Article Header */}
            <header className="mb-4">
              {article.category_id?.name && (
                <Badge bg="warning" text="dark" className="px-3 py-2 mb-3 text-uppercase fw-semibold">
                  {article.category_id.name}
                </Badge>
              )}

              <h1 className="fw-bold mb-3 display-6 lh-base text-dark" style={{ letterSpacing: '-0.5px' }}>
                {article.title}
              </h1>

              <div className="d-flex flex-wrap align-items-center gap-3 text-muted small pb-3 border-bottom">
                <span className="d-flex align-items-center gap-1">
                  <Calendar size={14} /> {new Date(article.published_at || article.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Clock size={14} /> {readingTime} phút đọc
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Eye size={14} /> {article.view_count || 0} lượt xem
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary ms-auto d-flex align-items-center gap-1 rounded-pill"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
                    }
                  }}
                >
                  <Share2 size={13} /> Chia sẻ
                </button>
              </div>
            </header>

            {/* 3. Sapo Box */}
            {article.summary && (
              <div
                className="p-3 p-md-4 rounded-3 mb-4 fw-semibold"
                style={{
                  backgroundColor: '#fff7ed',
                  borderLeft: '4px solid #ea580c',
                  fontSize: '1.12rem',
                  lineHeight: '1.7',
                  color: '#431407',
                }}
              >
                {article.summary}
              </div>
            )}

            {/* 4. Cover Image */}
            {article.cover_image?.url && (
              <figure className="mb-4 text-center">
                <img
                  src={article.cover_image.url}
                  alt={article.cover_image.alt || article.title}
                  className="img-fluid rounded-4 shadow-sm w-100"
                  style={{ maxHeight: '480px', objectFit: 'cover' }}
                />
                {article.cover_image.caption && (
                  <figcaption className="mt-2 text-muted small fst-italic">
                    {article.cover_image.caption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* 5. Article Body Blocks */}
            <div className="article-body mb-5">
              <ArticleContentRenderer blocks={article.content} />
            </div>

            {/* 6. Curated Sources Box */}
            {article.content_source_type === 'curated' && article.sources?.length > 0 && (
              <Card className="mb-4 bg-light border-0 rounded-3">
                <Card.Body className="p-3">
                  <div className="fw-bold small text-muted text-uppercase mb-2">Nguồn tham khảo:</div>
                  <ul className="mb-0 ps-3 small">
                    {article.sources.map((s, idx) => (
                      <li key={idx} className="mb-1">
                        {s.title}
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="ms-1 text-decoration-none" style={{ color: '#ea580c' }}>
                            <ExternalLink size={12} className="ms-1" />
                          </a>
                        )}
                        {s.author && <span className="text-muted ms-1">({s.author})</span>}
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            )}

            {/* 7. Tags */}
            {article.tags?.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-5 align-items-center">
                <span className="text-muted small fw-semibold">Từ khóa:</span>
                {article.tags.map((tag, i) => (
                  <Badge key={i} bg="light" text="dark" className="border px-2 py-1 fw-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 8. Related Tours Section */}
            {article.related_tour_ids?.length > 0 && (
              <div className="mb-5 p-4 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h5 className="fw-bold d-flex align-items-center gap-2 mb-3 text-dark">
                  <Compass size={20} color="#ea580c" /> Tour du lịch gợi ý trong bài
                </h5>
                <Row className="g-3">
                  {article.related_tour_ids.map((tour) => (
                    <Col key={tour._id} md={6}>
                      <Card className="h-100 border-0 shadow-sm overflow-hidden">
                        <Row className="g-0 align-items-center">
                          <Col xs={4}>
                            <img
                              src={tour.cover_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'}
                              alt={tour.title}
                              className="w-100 h-100 object-fit-cover"
                              style={{ minHeight: '90px' }}
                            />
                          </Col>
                          <Col xs={8} className="p-2 ps-3">
                            <small className="text-muted fw-bold d-block" style={{ fontSize: '11px' }}>{tour.code}</small>
                            <Link to={`/tour/${tour._id}`} className="text-decoration-none text-dark fw-bold small line-clamp-2 hover-orange mb-1">
                              {tour.title}
                            </Link>
                            <div className="fw-bold text-danger small">
                              {tour.sale_price ? tour.sale_price.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* 9. Related Articles Grid */}
            {relatedArticles.length > 0 && (
              <div className="pt-4 border-top">
                <h4 className="fw-bold mb-4">Bài viết cùng chuyên mục</h4>
                <Row className="g-3">
                  {relatedArticles.map((relArt) => (
                    <Col key={relArt._id} md={4}>
                      <ArticleCard article={relArt} />
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ArticleDetailPage;
