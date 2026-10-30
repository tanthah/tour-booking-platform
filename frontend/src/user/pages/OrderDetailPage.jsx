import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Badge, Modal, Button } from 'react-bootstrap';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../config/axiosClient';

const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const [orderRes, refundRes] = await Promise.all([
        axiosClient.get(`/orders/${id}`),
        axiosClient.get(`/orders/${id}/refunds`).catch(() => ({ data: [] })),
      ]);
      setOrder(orderRes?.data || null);
      setRefunds(refundRes?.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải thông tin đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => { fetchOrder(); }, 0);
      return () => clearTimeout(timer);
    }
  }, [id, fetchOrder]);

  const getCancelEstimate = () => {
    if (!order) return { feePercent: 100, feeAmount: 0, refundAmount: 0, diffDays: 0 };
    const earliestDate = order.items?.reduce((earliest, it) => {
      if (!it.departure_date) return earliest;
      const d = new Date(it.departure_date);
      return !earliest || d < earliest ? d : earliest;
    }, null);
    if (!earliestDate) return { feePercent: 100, feeAmount: order.total_amount, refundAmount: 0, diffDays: 0 };
    const diffDays = Math.round((new Date(earliestDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
    const fee = diffDays > 20 ? 3 : diffDays >= 16 ? 25 : diffDays >= 11 ? 50 : diffDays >= 6 ? 75 : 100;
    const feeAmount = Math.round((order.total_amount * fee) / 100);
    const refundAmount = Math.max(0, (order.paid_amount || 0) - feeAmount);
    return { feePercent: fee, feeAmount, refundAmount, diffDays };
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await axiosClient.patch(`/orders/${id}/cancel`, {
        cancel_reason: cancelReasonInput.trim() || 'Khách hàng tự hủy trên hệ thống',
      });
      setSuccessMsg('Đã hủy đơn hàng thành công.');
      setShowCancelModal(false);
      fetchOrder();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể hủy đơn hàng.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{errorMsg || 'Không tìm thấy đơn hàng.'}</Alert>
        <Link to="/" className="btn btn-warning">Về trang chủ</Link>
      </Container>
    );
  }

  const cancelEst = getCancelEstimate();
  const canCancel = ['PENDING_PAYMENT', 'DEPOSIT_CONFIRMED', 'CONFIRMED'].includes(order.order_status);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '36px 0 80px' }}>
      <Container>
        {location.state?.justCreated && (
          <Alert variant="success" className="mb-4 text-center py-2">
            <strong>🎉 Đặt Tour Thành Công!</strong> Mã đơn: <strong>{order.order_code}</strong>.
          </Alert>
        )}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Đơn Hàng: <span style={{ color: '#ea580c' }}>{order.order_code}</span>
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Ngày tạo: {new Date(order.created_at).toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {order.order_status === 'PENDING_PAYMENT' && <Badge bg="warning" text="dark">Chờ thanh toán</Badge>}
            {order.order_status === 'DEPOSIT_CONFIRMED' && <Badge bg="info">Đã cọc 30%</Badge>}
            {order.order_status === 'CONFIRMED' && <Badge bg="primary">Đã xác nhận</Badge>}
            {order.order_status === 'AWAITING_STAFF' && <Badge bg="danger">Chờ nhân viên xử lý</Badge>}
            {order.order_status === 'COMPLETED' && <Badge bg="success">Hoàn thành</Badge>}
            {order.order_status === 'CANCELLED' && <Badge bg="secondary">Đã hủy</Badge>}

            {order.payment_status === 'PENDING' && <Badge bg="secondary">Chưa thanh toán</Badge>}
            {order.payment_status === 'DEPOSIT_PAID' && <Badge bg="info">Đã nhận cọc</Badge>}
            {order.payment_status === 'PAID' && <Badge bg="success">Đã thanh toán đủ</Badge>}
            {order.payment_status === 'FAILED' && <Badge bg="danger">Thất bại</Badge>}
            {order.payment_status === 'REFUNDED' && <Badge bg="dark">Đã hoàn tiền</Badge>}
          </div>
        </div>

        {order.order_status === 'CANCELLED' && (
          <Alert variant="secondary" className="mb-3 py-2">
            <strong>Thông tin hủy:</strong> {order.cancel_reason || 'Không có lý do'}&nbsp;
            {order.cancel_fee_percent !== null && (
              <span>(Phí hủy: {order.cancel_fee_percent}% — {order.cancel_fee_amount?.toLocaleString('vi-VN')} đ)</span>
            )}
          </Alert>
        )}

        <Row className="gy-4">
          <Col lg={8}>
            {/* 1. Danh sách Tour */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
                Danh Sách Tour Đặt ({order.items?.length || 0})
              </h3>
              {order.items?.map((item) => (
                <div key={item._id} className="d-flex flex-wrap gap-3 pb-3 mb-3 border-bottom">
                  {item.main_image && (
                    <img src={item.main_image} alt={item.tour_name} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  )}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{item.tour_name}</div>
                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Mã: <strong>{item.tour_code || 'N/A'}</strong> | {item.duration || 'N/A'}
                    </div>
                    {item.departure_date && (
                      <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                        Khởi hành: <strong>{new Date(item.departure_date).toLocaleDateString('vi-VN')}</strong> ({item.departure_location})
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '4px' }}>
                      {item.quantity_adult} lớn ({item.price_adult?.toLocaleString('vi-VN')} đ)
                      {item.quantity_child > 0 ? `, ${item.quantity_child} trẻ (${item.price_child?.toLocaleString('vi-VN')} đ)` : ''}
                      {item.quantity_baby > 0 ? `, ${item.quantity_baby} bé (${item.price_baby?.toLocaleString('vi-VN')} đ)` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>
                    {(item.subtotal || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Danh sách Khách */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
                Danh Sách Khách Đi Tour ({order.booking_customers?.length || 0} khách)
              </h3>
              <div className="table-responsive">
                <table className="table table-sm" style={{ fontSize: '13px' }}>
                  <thead className="table-light"><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Giới tính</th><th>Ngày sinh</th></tr></thead>
                  <tbody>
                    {order.booking_customers?.map((cust, idx) => (
                      <tr key={cust._id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{cust.full_name}</td>
                        <td>{cust.phone}</td>
                        <td>{cust.gender === 'MALE' ? 'Nam' : cust.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</td>
                        <td>{cust.date_of_birth ? new Date(cust.date_of_birth).toLocaleDateString('vi-VN') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Lịch sử hoàn tiền (nếu có) */}
            {refunds.length > 0 && (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
                  Yêu Cầu Hoàn Tiền ({refunds.length})
                </h3>
                {refunds.map((rf) => (
                  <div key={rf._id} className="p-3 mb-2 rounded border" style={{ background: '#f8fafc', fontSize: '13px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong>Số tiền hoàn: <span style={{ color: '#ea580c', fontSize: '15px' }}>{rf.refund_amount.toLocaleString('vi-VN')} đ</span></strong>
                      <Badge bg={rf.status === 'COMPLETED' ? 'success' : rf.status === 'PROCESSING' ? 'warning' : rf.status === 'FAILED' ? 'danger' : 'secondary'}>
                        {rf.status === 'PENDING' ? 'Chờ duyệt' : rf.status === 'PROCESSING' ? 'Đang hoàn' : rf.status === 'COMPLETED' ? 'Thành công' : 'Thất bại'}
                      </Badge>
                    </div>
                    <div style={{ color: '#64748b' }}>Phương thức: {rf.refund_method} | Tạo lúc: {new Date(rf.created_at).toLocaleString('vi-VN')}</div>
                    {rf.transaction_id && <div>Mã giao dịch: <strong>{rf.transaction_id}</strong></div>}
                  </div>
                ))}
              </div>
            )}
          </Col>

          {/* Cột phải: Thanh toán */}
          <Col lg={4}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>Thông Tin Người Đặt</h3>
              <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>Họ tên: <strong>{order.customer_info?.full_name}</strong></div>
              <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>SĐT: <strong>{order.customer_info?.phone}</strong></div>
              {order.customer_info?.email && <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>Email: <strong>{order.customer_info.email}</strong></div>}
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>Chi Tiết Tài Chính</h3>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13.5px' }}>
                <span>Phương thức:</span><strong>{order.payment_method}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13.5px' }}>
                <span>Tổng đơn:</span><strong style={{ fontSize: '16px' }}>{(order.total_amount || 0).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13.5px', color: '#16a34a' }}>
                <span>Đã thanh toán:</span><strong>{(order.paid_amount || 0).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13.5px', color: '#dc2626' }}>
                <span>Còn nợ:</span><strong>{(order.remaining_amount || 0).toLocaleString('vi-VN')} đ</strong>
              </div>
              {order.payment_deadline && (
                <div className="p-2 mb-3 rounded" style={{ background: '#fff7ed', border: '1px solid #fed7aa', fontSize: '12.5px', color: '#c2410c' }}>
                  Hạn thanh toán 100%: <strong>{new Date(order.payment_deadline).toLocaleDateString('vi-VN')}</strong> (D-16)
                </div>
              )}

              {canCancel && (
                <button
                  type="button"
                  className="btn btn-outline-danger w-100 py-2 mb-2"
                  style={{ borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelling}
                >
                  Hủy Đơn Hàng
                </button>
              )}

              <button
                type="button"
                className="btn btn-light w-100 py-2"
                style={{ borderRadius: '10px', fontSize: '14px' }}
                onClick={() => navigate('/ho-so-ca-nhan')}
              >
                Đơn hàng của tôi
              </button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modal xác nhận hủy đơn */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: '17px', fontWeight: 700 }}>Xác Nhận Hủy Đơn Hàng</Modal.Title></Modal.Header>
        <Modal.Body style={{ fontSize: '14px' }}>
          <p>Tour khởi hành sau <strong>{cancelEst.diffDays} ngày</strong>. Chính sách phí hủy áp dụng:</p>
          <div className="p-3 rounded mb-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div>Tỷ lệ phí hủy: <strong style={{ color: '#dc2626' }}>{cancelEst.feePercent}%</strong> ({cancelEst.feeAmount.toLocaleString('vi-VN')} đ)</div>
            <div>Số tiền hoàn dự kiến: <strong style={{ color: '#16a34a', fontSize: '16px' }}>{cancelEst.refundAmount.toLocaleString('vi-VN')} đ</strong></div>
          </div>
          <div className="mb-2">
            <label className="form-label">Lý do hủy đơn (tùy chọn):</label>
            <input type="text" className="form-control" placeholder="Nhập lý do..." value={cancelReasonInput} onChange={(e) => setCancelReasonInput(e.target.value)} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Đóng</Button>
          <Button variant="danger" onClick={handleConfirmCancel} disabled={cancelling}>{cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
