import { Modal, Button } from 'react-bootstrap';

const OrderCancelModal = ({
  show,
  onHide,
  cancelEst,
  cancelReasonInput,
  setCancelReasonInput,
  handleConfirmCancel,
  cancelling,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '17px', fontWeight: 700 }}>
          Xác Nhận Hủy Đơn Hàng
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontSize: '14px' }}>
        <p>
          Tour khởi hành sau <strong>{cancelEst.diffDays} ngày</strong>. Chính sách phí hủy áp dụng:
        </p>
        <div className="p-3 rounded mb-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div>
            Tỷ lệ phí hủy: <strong style={{ color: '#dc2626' }}>{cancelEst.feePercent}%</strong> ({cancelEst.feeAmount.toLocaleString('vi-VN')} đ)
          </div>
          <div>
            Số tiền hoàn dự kiến: <strong style={{ color: '#16a34a', fontSize: '16px' }}>{cancelEst.refundAmount.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>
        <div className="mb-2">
          <label className="form-label">Lý do hủy đơn (tùy chọn):</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nhập lý do..."
            value={cancelReasonInput}
            onChange={(e) => setCancelReasonInput(e.target.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
        <Button variant="danger" onClick={handleConfirmCancel} disabled={cancelling}>
          {cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderCancelModal;

