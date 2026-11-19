import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { CheckCircle, AlertTriangle, Send } from 'lucide-react';
import articleService from '../articleService';

function ArticleReviewActionModal({ show, onHide, article, actionType, onSuccess }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRequestChanges = actionType === 'REQUEST_CHANGES';
  const isApprove = actionType === 'APPROVE';
  const isPublish = actionType === 'PUBLISH';

  useEffect(() => {
    if (show) {
      setComment('');
      setError('');
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRequestChanges && !comment.trim()) {
      setError('Vui lòng nhập lý do / phản hồi cần chỉnh sửa');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isRequestChanges) {
        await articleService.requestChanges(article._id, comment.trim());
      } else if (isApprove) {
        await articleService.approveArticle(article._id, comment.trim());
      } else if (isPublish) {
        await articleService.publishArticle(article._id);
      }

      onSuccess && onSuccess(isRequestChanges ? 'Đã yêu cầu chỉnh sửa bài viết' : isApprove ? 'Phê duyệt bài viết thành công' : 'Xuất bản bài viết thành công');
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Thao tác xét duyệt thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            {isRequestChanges && <><AlertTriangle size={20} className="text-danger" /> Yêu cầu chỉnh sửa bài viết</>}
            {isApprove && <><CheckCircle size={20} className="text-success" /> Phê duyệt bài viết</>}
            {isPublish && <><Send size={20} className="text-primary" /> Xuất bản bài viết</>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="mb-3">
            <span className="text-muted small d-block mb-1">Bài viết:</span>
            <div className="fw-bold text-dark">{article?.title}</div>
            <div className="text-muted small text-truncate">{article?.summary}</div>
          </div>

          {isRequestChanges && (
            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold">
                Nội dung yêu cầu chỉnh sửa <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Nêu rõ các điểm cần sửa chữa hoặc bổ sung cho tác giả..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                autoFocus
              />
              <Form.Text className="text-muted">
                Tác giả bài viết sẽ nhận được nhận xét này để hoàn thiện bản viết.
              </Form.Text>
            </Form.Group>
          )}

          {isApprove && (
            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold">Ghi chú duyệt bài (tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Ghi chú thêm cho tác giả nếu có..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Form.Group>
          )}

          {isPublish && (
            <p className="text-secondary small mb-0">
              Bài viết sẽ được công khai ngay lập tức trên trang tin tức cho tất cả khách hàng.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={onHide} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            variant={isRequestChanges ? 'danger' : isApprove ? 'success' : 'primary'}
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : isRequestChanges ? (
              'Gửi yêu cầu sửa'
            ) : isApprove ? (
              'Xác nhận phê duyệt'
            ) : (
              'Xuất bản ngay'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ArticleReviewActionModal;
