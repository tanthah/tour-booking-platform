import { useState, useEffect } from 'react';
import { Spinner, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../config/axiosClient';

/**
 * UserOrdersList - Danh sách lịch sử đơn hàng của khách hàng
 */
const UserOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/orders');
      setOrders(res?.data?.orders || []);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

  if (errorMsg) {
    return <Alert variant="danger">{errorMsg}</Alert>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-5 text-muted bg-light rounded-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="mb-2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p className="mb-0">Bạn chưa có đơn đặt tour nào.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-4" style={{ color: '#ea580c', fontWeight: 700 }}>
        Đơn Hàng Của Tôi ({orders.length})
      </h4>

      {orders.map((order) => (
        <div
          key={order._id}
          className="p-3 mb-3 border rounded-3 bg-white shadow-sm"
          style={{ transition: 'box-shadow 0.2s ease' }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center pb-2 mb-2 border-bottom gap-2">
            <div>
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>
                {order.order_code}
              </span>
              <span className="text-muted ms-2" style={{ fontSize: '12.5px' }}>
                ({new Date(order.created_at).toLocaleDateString('vi-VN')})
              </span>
            </div>

            <div className="d-flex gap-2 align-items-center">
              {order.order_status === 'PENDING_PAYMENT' && <Badge bg="warning" text="dark">Chờ thanh toán</Badge>}
              {order.order_status === 'CONFIRMED' && <Badge bg="primary">Đã xác nhận</Badge>}
              {order.order_status === 'COMPLETED' && <Badge bg="success">Hoàn thành</Badge>}
              {order.order_status === 'CANCELLED' && <Badge bg="danger">Đã hủy</Badge>}

              {order.payment_status === 'PENDING' && <Badge bg="secondary">Chưa thanh toán</Badge>}
              {order.payment_status === 'PAID' && <Badge bg="success">Đã thanh toán</Badge>}
              {order.payment_status === 'FAILED' && <Badge bg="danger">Thất bại</Badge>}
              {order.payment_status === 'REFUNDED' && <Badge bg="info">Đã hoàn tiền</Badge>}
            </div>
          </div>

          {/* Tour items summary */}
          <div className="mb-2">
            {order.items?.map((it, idx) => (
              <div key={idx} style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                • {it.tour_name} ({it.quantity} khách)
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
            <div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Tổng tiền: </span>
              <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '16px' }}>
                {(order.total_amount || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              style={{ fontWeight: 600, borderRadius: '6px' }}
              onClick={() => navigate(`/don-hang/${order._id}`)}
            >
              Xem chi tiết &rarr;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserOrdersList;
