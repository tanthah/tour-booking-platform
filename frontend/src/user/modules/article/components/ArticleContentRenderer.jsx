import { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { ListCollapse, Quote } from 'lucide-react';

const toAnchorId = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
};

function ArticleContentRenderer({ blocks = [] }) {
  const headings = useMemo(() => {
    if (!Array.isArray(blocks)) return [];
    return blocks
      .filter((b) => b.type === 'header' && b.data?.text)
      .map((b) => ({
        id: toAnchorId(b.data.text),
        text: b.data.text,
        level: b.data.level || 2,
      }));
  }, [blocks]);

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <div className="py-4 text-muted text-center italic">
        Nội dung bài viết đang được cập nhật.
      </div>
    );
  }

  return (
    <article className="article-rendered-content" style={{ fontSize: '1.08rem', lineHeight: '1.8' }}>
      {/* Mục lục bài viết (nếu có từ 3 tiêu đề phụ trở lên) */}
      {headings.length >= 3 && (
        <Card className="mb-4 border-0 bg-light rounded-3 shadow-sm">
          <Card.Body className="p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 mb-2 fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
              <ListCollapse size={18} color="#ea580c" />
              <span>Mục lục bài viết</span>
            </div>
            <ol className="mb-0 ps-3">
              {headings.map((h, i) => (
                <li key={i} className={`mb-1 ${h.level === 3 ? 'ps-3 text-muted' : 'fw-semibold'}`}>
                  <a
                    href={`#${h.id}`}
                    className="text-decoration-none text-dark hover-orange"
                    style={{ fontSize: '0.95rem' }}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </Card.Body>
        </Card>
      )}

      {/* Render từng block */}
      <div className="article-body-blocks">
        {blocks.map((block, index) => {
          const key = block.id || index;

          if (block.type === 'header') {
            const anchorId = toAnchorId(block.data.text);
            if (block.data.level === 3) {
              return (
                <h3
                  key={key}
                  id={anchorId}
                  className="fw-bold mt-4 mb-3 pt-2 text-dark"
                  style={{ fontSize: '1.35rem', scrollMarginTop: '120px' }}
                >
                  {block.data.text}
                </h3>
              );
            }
            return (
              <h2
                key={key}
                id={anchorId}
                className="fw-bold mt-4 mb-3 pt-3 text-dark border-bottom pb-2"
                style={{ fontSize: '1.65rem', scrollMarginTop: '120px' }}
              >
                {block.data.text}
              </h2>
            );
          }

          if (block.type === 'paragraph') {
            return (
              <p
                key={key}
                className="mb-3 text-dark"
                style={{ color: '#27272a', whiteSpace: 'pre-line' }}
              >
                {block.data.text}
              </p>
            );
          }

          if (block.type === 'image') {
            const imgUrl = block.data.file?.url || block.data.url;
            if (!imgUrl) return null;
            return (
              <figure key={key} className="my-4 text-center">
                <img
                  src={imgUrl}
                  alt={block.data.alt || block.data.caption || 'Hình ảnh du lịch'}
                  className="img-fluid rounded-3 shadow-sm border"
                  style={{ maxHeight: '560px', width: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                {block.data.caption && (
                  <figcaption className="mt-2 text-muted small fst-italic">
                    {block.data.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          if (block.type === 'quote') {
            return (
              <figure
                key={key}
                className="my-4 p-3 p-md-4 rounded-3 position-relative"
                style={{
                  backgroundColor: '#fff7ed',
                  borderLeft: '4px solid #ea580c',
                }}
              >
                <Quote
                  size={32}
                  color="#ea580c"
                  style={{ opacity: 0.25, position: 'absolute', top: '12px', right: '16px' }}
                />
                <blockquote className="blockquote mb-2 fst-italic" style={{ fontSize: '1.15rem', color: '#7c2d12' }}>
                  <p className="mb-0">"{block.data.text}"</p>
                </blockquote>
                {block.data.caption && (
                  <figcaption className="blockquote-footer text-muted mb-0">
                    {block.data.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          if (block.type === 'list') {
            const items = Array.isArray(block.data.items) ? block.data.items : [];
            return (
              <ul key={key} className="my-3 ps-4">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="mb-1 text-dark">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          if (block.type === 'delimiter') {
            return (
              <div key={key} className="text-center my-4 text-muted">
                <span style={{ letterSpacing: '12px', fontSize: '1.2rem', color: '#cbd5e1' }}>
                  •••
                </span>
              </div>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
}

export default ArticleContentRenderer;
