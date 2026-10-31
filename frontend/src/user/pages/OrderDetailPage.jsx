import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import { createZaloPayPayment, getPaymentsByOrder } from '../modules/payment/paymentService';
import ZaloPayQRModal from '../components/checkout/ZaloPayQRModal';
import OrderCancelModal from '../components/order/OrderCancelModal';
import OrderPaymentHistory from '../components/order/OrderPaymentHistory';
import OrderItemsList from '../components/order/OrderItemsList';

const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showZaloPayModal, setShowZaloPayModal] = useState(false);
  const [zaloPayModalData, setZaloPayModalData] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const [orderRes, refundRes, paymentRes] = await Promise.all([
        axiosClient.get(`/orders/${id}`),
        axiosClient.get(`/orders/${id}/refunds`).catch(() => ({ data: [] })),
        getPaymentsByOrder(id).catch(() => []),
      ]);
      setOrder(orderRes?.data || null);
      setRefunds(refundRes?.data || []);
      setPayments(Array.isArray(paymentRes) ? paymentRes : paymentRes?.data || []);
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

  const handlePayZaloPay = async () => {
    try {
      setPaying(true);
      setErrorMsg('');
      const pType = order.order_status === 'DEPOSIT_CONFIRMED' ? 'remaining' : (order.deposit_amount ? 'deposit' : 'full');
      const zpData = await createZaloPayPayment({ orderId: id, paymentType: pType });
      setZaloPayModalData({ ...zpData, order });
      setShowZaloPayModal(true);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể khởi tạo giao dịch ZaloPay.');
    } finally {
      setPaying(false);
    }
  };

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
  const canPay = (order.order_status === 'PENDING_PAYMENT' || order.order_status === 'DEPOSIT_CONFIRMED') && (order.remaining_amount > 0 || order.paid_amount === 0);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '36px 0 80px' }}>
      <Container>
        {(location.state?.justCreated || location.state?.justPaid) && (
          <Alert variant="success" className="mb-4 text-center py-2">
            <strong>🎉 {location.state?.justPaid ? 'Thanh Toán Thành Công!' : 'Đặt Tour Thành Công!'}</strong> Mã đơn: <strong>{order.order_code}</strong>.
          </Alert>
        )}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Đơn Hàng: <span style={{ color: '#ea580c' }}>{order.order_code}</span>
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Ngày tạo: {new Date(order.created_at).toLocaleString('vi-VN')}</div>
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
            {order.payment_status === 'REFUNDED' && <Badge bg="dark">Đã hoàn tiền</Badge>}
          </div>
        </div>

        <Row className="gy-4">
          <Col lg={8}>
            <OrderItemsList items={order.items} />

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

            <OrderPaymentHistory payments={payments} refunds={refunds} />
          </Col>

          <Col lg={4}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>Thông Tin Người Đặt</h3>
              <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>Họ tên: <strong>{order.customer_info?.full_name}</strong></div>
              <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>SĐT: <strong>{order.customer_info?.phone}</strong></div>
              {order.customer_info?.email && <div style={{ fontSize: '13.5px' }}>Email: <strong>{order.customer_info.email}</strong></div>}
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
                <span>Số dư còn lại:</span><strong>{(order.remaining_amount || 0).toLocaleString('vi-VN')} đ</strong>
              </div>
              {order.payment_deadline && (
                <div className="p-2 mb-3 rounded" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '12.5px', color: '#1d4ed8' }}>
                  Hạn thanh toán 70% đợt 2: <strong>{new Date(order.payment_deadline).toLocaleDateString('vi-VN')}</strong> (15 ngày trước khởi hành)
                </div>
              )}

              {canPay && (
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2 mb-2"
                  style={{ borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}
                  onClick={handlePayZaloPay}
                  disabled={paying}
                >
                  {paying ? <Spinner size="sm" animation="border" /> : (
                    order.order_status === 'DEPOSIT_CONFIRMED'
                      ? `Thanh toán số dư ${(order.remaining_amount || 0).toLocaleString('vi-VN')} đ qua ZaloPay`
                      : `Thanh toán ${(order.deposit_amount || order.total_amount).toLocaleString('vi-VN')} đ qua ZaloPay`
                  )}
                </button>
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

      <ZaloPayQRModal
        show={showZaloPayModal}
        onHide={() => setShowZaloPayModal(false)}
        paymentData={zaloPayModalData}
        onPaymentSuccess={() => {
          setShowZaloPayModal(false);
          fetchOrder();
        }}
      />

      <OrderCancelModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        cancelEst={cancelEst}
        cancelReasonInput={cancelReasonInput}
        setCancelReasonInput={setCancelReasonInput}
        handleConfirmCancel={handleConfirmCancel}
        cancelling={cancelling}
      />
    </div>
  );
};

export default OrderDetailPage;
