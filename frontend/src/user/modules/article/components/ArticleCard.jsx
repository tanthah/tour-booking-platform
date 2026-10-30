import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';
import { Calendar, Eye, Clock } from 'lucide-react';

function ArticleCard({ article }) {
  if (!article) return null;

  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const readingTime = Math.max(
    2,
    Math.ceil(((article.summary || '').length + (article.title || '').length * 5) / 120)
  );

  return (
    <Card className="article-card h-100 shadow-sm border-0 rounded-3 overflow-hidden transition-all">
      <Link
        to={`/tin-tuc/${article.slug}`}
        className="article-card-thumb d-block position-relative overflow-hidden"
        style={{ height: '210px', backgroundColor: '#f1f5f9' }}
      >
        {article.cover_image?.url ? (
          <img
            src={article.cover_image.url}
            alt={article.cover_image.alt || article.title}
            className="w-100 h-100 object-fit-cover article-card-img"
            loading="lazy"
          />
        ) : (
          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted bg-light">
            <span>TourBooking News</span>
          </div>
        )}
        {article.category_id?.name && (
          <Badge
            bg="warning"
            text="dark"
            className="position-absolute top-0 start-0 m-3 px-2 py-1 text-uppercase fw-semibold"
            style={{ fontSize: '11px', letterSpacing: '0.5px' }}
          >
            {article.category_id.name}
          </Badge>
        )}
      </Link>

      <Card.Body className="d-flex flex-column p-3">
        <div className="d-flex align-items-center gap-3 text-muted small mb-2" style={{ fontSize: '12px' }}>
          {dateStr && (
            <span className="d-flex align-items-center gap-1">
              <Calendar size={13} /> {dateStr}
            </span>
          )}
          <span className="d-flex align-items-center gap-1">
            <Clock size={13} /> {readingTime} phút đọc
          </span>
          {article.view_count > 0 && (
            <span className="d-flex align-items-center gap-1 ms-auto">
              <Eye size={13} /> {article.view_count}
            </span>
          )}
        </div>

        <h5 className="article-card-title fw-bold mb-2 line-clamp-2" style={{ fontSize: '1.05rem', lineHeight: '1.4' }}>
          <Link
            to={`/tin-tuc/${article.slug}`}
            className="text-decoration-none text-dark hover-primary"
          >
            {article.title}
          </Link>
        </h5>

        <p className="article-card-summary text-muted small line-clamp-3 mb-3 flex-grow-1" style={{ lineHeight: '1.5' }}>
          {article.summary || 'Khám phá chi tiết điểm đến và cẩm nang du lịch hữu ích trong bài viết này...'}
        </p>

        <div className="pt-2 border-top d-flex justify-content-between align-items-center">
          <Link
            to={`/tin-tuc/${article.slug}`}
            className="fw-bold text-decoration-none small"
            style={{ color: '#ea580c' }}
          >
            Đọc tiếp →
          </Link>
          {article.tags?.length > 0 && (
            <span className="text-muted small">#{article.tags[0]}</span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default ArticleCard;
