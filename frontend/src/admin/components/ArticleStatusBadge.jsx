import { Badge } from 'react-bootstrap';

/**
 * Component hiển thị Badge trạng thái bài viết theo chuẩn hệ thống
 */
function ArticleStatusBadge({ status }) {
  switch (status) {
    case 'PENDING_REVIEW':
      return <Badge bg="warning" text="dark" className="fw-semibold">Chờ duyệt</Badge>;
    case 'CHANGES_REQUESTED':
      return <Badge bg="danger" className="fw-semibold">Cần chỉnh sửa</Badge>;
    case 'APPROVED':
      return <Badge bg="info" text="dark" className="fw-semibold">Đã phê duyệt</Badge>;
    case 'PUBLISHED':
      return <Badge bg="success" className="fw-semibold">Đã xuất bản</Badge>;
    case 'ARCHIVED':
      return <Badge bg="dark" className="fw-semibold">Lưu trữ</Badge>;
    case 'DRAFT':
    default:
      return <Badge bg="secondary" className="fw-semibold">Bản nháp</Badge>;
  }
}

export default ArticleStatusBadge;
