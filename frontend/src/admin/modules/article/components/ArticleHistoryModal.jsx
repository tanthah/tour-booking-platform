import { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Clock, MessageSquare, CheckCircle, AlertTriangle, Send, Archive } from 'lucide-react';
import articleService from '../articleService';

function getActionMeta(action) {
  switch (action) {
    case 'SUBMITTED':
      return { label: 'Gửi duyệt bài', icon: <Send size={15} className="text-warning" />, bg: 'warning', textDark: true };
    case 'APPROVED':
      return { label: 'Phê duyệt', icon: <CheckCircle size={15} className="text-success" />, bg: 'success', textDark: false };
    case 'CHANGES_REQUESTED':
      return { label: 'Yêu cầu chỉnh sửa', icon: <AlertTriangle size={15} className="text-danger" />, bg: 'danger', textDark: false };
    case 'PUBLISHED':
      return { label: 'Xuất bản', icon: <CheckCircle size={15} className="text-primary" />, bg: 'primary', textDark: false };
    case 'ARCHIVED':
      return { label: 'Lưu trữ', icon: <Archive size={15} className="text-secondary" />, bg: 'secondary', textDark: false };
    case 'ASSIGNED':
      return { label: 'Phân công', icon: <Clock size={15} className="text-info" />, bg: 'info', textDark: true };
    case 'UNASSIGNED':
      return { label: 'Hủy phân công', icon: <Clock size={15} className="text-muted" />, bg: 'light', textDark: true };
    default:
      return { label: action, icon: <Clock size={15} className="text-muted" />, bg: 'secondary', textDark: false };
  }
}

function ArticleHistoryModal({ show, onHide, article }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && article?._id) {
      const fetchHistory = async () => {
        try {
          setLoading(true);
          setError('');
          const res = await articleService.getReviewHistory(article._id);
          setHistory(res.data || []);
        } catch (err) {
          setError(err.response?.data?.message || 'Không thể tải lịch sử duyệt bài');
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [show, article]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
          <Clock size={20} className="text-primary" />
          Lịch sử duyệt bài: {article?.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted small">Đang tải lịch sử...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-4 text-muted">
            Chưa có ghi nhận xét duyệt nào cho bài viết này.
          </div>
        ) : (
          <div className="timeline-list d-flex flex-column gap-3">
            {history.map((item) => {
              const meta = getActionMeta(item.action);
              return (
                <div key={item._id} className="border rounded p-3 bg-light shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      {meta.icon}
                      <Badge bg={meta.bg} text={meta.textDark ? 'dark' : 'white'} className="fw-semibold">
                        {meta.label}
                      </Badge>
                      <span className="fw-bold text-dark small">
                        {item.reviewer_id?.full_name || item.reviewer_id?.email || 'Hệ thống'}
                      </span>
                    </div>
                    <small className="text-muted">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </small>
                  </div>
                  {item.comment && (
                    <div className="p-2 rounded bg-white border small text-secondary mt-1">
                      <MessageSquare size={13} className="me-1 text-muted" />
                      {item.comment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ArticleHistoryModal;
