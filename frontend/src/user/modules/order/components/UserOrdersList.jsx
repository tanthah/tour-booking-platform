import { useState, useEffect } from 'react';
import { Spinner, Badge, Alert, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../config/axiosClient';

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { id: 'PAID', label: 'Đã thanh toán' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

/**
 * UserOrdersList - Danh sách lịch sử & bộ lọc đơn hàng của khách hàng
 */
const UserOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/orders?limit=50');
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

  const matchesFilter = (order, filterId) => {
    if (filterId === 'ALL') return true;
    if (filterId === 'PENDING_PAYMENT') {
      return order.order_status === 'PENDING_PAYMENT' || order.payment_status === 'PENDING';
    }
    if (filterId === 'PAID') {
      return (
        order.payment_status === 'PAID' ||
        order.payment_status === 'DEPOSIT_PAID' ||
        ['CONFIRMED', 'DEPOSIT_CONFIRMED'].includes(order.order_status)
      );
    }
    if (filterId === 'COMPLETED') {
      return order.order_status === 'COMPLETED';
    }
    if (filterId === 'CANCELLED') {
      return order.order_status === 'CANCELLED';
    }
    return true;
  };

  const getTabCount = (filterId) => orders.filter((o) => matchesFilter(o, filterId)).length;

  const filteredOrders = orders.filter((order) => {
    if (!matchesFilter(order, activeFilter)) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchCode = order.order_code?.toLowerCase().includes(term);
    const matchTour = order.items?.some((it) => it.tour_name?.toLowerCase().includes(term));
    return matchCode || matchTour;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

  if (errorMsg) return <Alert variant="danger">{errorMsg}</Alert>;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0" style={{ color: '#ea580c', fontWeight: 700 }}>
          Đơn Hàng Của Tôi ({orders.length})
        </h4>
        <div style={{ width: '260px' }}>
          <InputGroup size="sm">
            <Form.Control
              placeholder="Tìm theo mã đơn, tên tour..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </InputGroup>
        </div>
      </div>

      {/* Tabs lọc trạng thái đơn hàng */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-1" style={{ borderBottom: '1px solid #e2e8f0' }}>
        {FILTER_TABS.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 text-nowrap"
              style={{
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#fff7ed' : 'transparent',
                color: isActive ? '#ea580c' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                borderBottom: isActive ? '2px solid #ea580c' : '2px solid transparent',
                padding: '8px 14px',
              }}
              onClick={() => setActiveFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#ea580c' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Danh sách đơn hàng theo bộ lọc */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light rounded-3">
          <p className="mb-0" style={{ fontSize: '14px' }}>
            {searchTerm
              ? `Không tìm thấy đơn hàng nào khớp với từ khóa "${searchTerm}".`
              : `Không có đơn hàng nào ở trạng thái "${FILTER_TABS.find((t) => t.id === activeFilter)?.label}".`}
          </p>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const canPayDeposit = order.order_status === 'PENDING_PAYMENT';
          const canPayRemaining = order.order_status === 'DEPOSIT_CONFIRMED' && order.remaining_amount > 0;

          return (
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
                  <span className="ms-2 badge bg-light text-secondary border">
                    {order.payment_method === 'ZALOPAY' ? 'ZaloPay' : 'Tại quầy'}
                  </span>
                </div>

                <div className="d-flex gap-2 align-items-center flex-wrap">
                  {order.order_status === 'PENDING_PAYMENT' && <Badge bg="warning" text="dark">Chờ thanh toán</Badge>}
                  {order.order_status === 'DEPOSIT_CONFIRMED' && <Badge bg="info">Đã cọc 30%</Badge>}
                  {order.order_status === 'CONFIRMED' && <Badge bg="primary">Đã xác nhận</Badge>}
                  {order.order_status === 'AWAITING_STAFF' && <Badge bg="danger">Chờ xử lý</Badge>}
                  {order.order_status === 'COMPLETED' && <Badge bg="success">Hoàn thành</Badge>}
                  {order.order_status === 'CANCELLED' && <Badge bg="danger">Đã hủy</Badge>}

                  {order.payment_status === 'PENDING' && <Badge bg="secondary">Chưa thanh toán</Badge>}
                  {order.payment_status === 'DEPOSIT_PAID' && <Badge bg="info">Đã nhận cọc</Badge>}
                  {order.payment_status === 'PAID' && <Badge bg="success">Đã thanh toán đủ</Badge>}
                  {order.payment_status === 'REFUNDED' && <Badge bg="dark">Đã hoàn tiền</Badge>}
                </div>
              </div>

              {/* Tóm tắt các tour trong đơn */}
              <div className="mb-2">
                {order.items?.map((it, idx) => (
                  <div key={idx} style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                    • {it.tour_name} ({it.quantity} khách)
                    {it.departure_date && (
                      <span className="text-muted fw-normal ms-2" style={{ fontSize: '12px' }}>
                        - Khởi hành: {new Date(it.departure_date).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 border-top gap-2">
                <div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Tổng: </span>
                  <strong style={{ color: '#ea580c', fontSize: '16px' }}>
                    {(order.total_amount || 0).toLocaleString('vi-VN')} đ
                  </strong>
                  {order.paid_amount > 0 && (
                    <span className="ms-2 text-success" style={{ fontSize: '12.5px' }}>
                      (Đã trả: {order.paid_amount.toLocaleString('vi-VN')} đ)
                    </span>
                  )}
                  {order.remaining_amount > 0 && order.paid_amount > 0 && (
                    <span className="ms-2 text-danger" style={{ fontSize: '12.5px' }}>
                      (Còn nợ: {order.remaining_amount.toLocaleString('vi-VN')} đ)
                    </span>
                  )}
                </div>

                <div className="d-flex gap-2">
                  {canPayDeposit && (
                    <button
                      type="button"
                      className="btn btn-sm btn-warning text-dark fw-bold"
                      style={{ borderRadius: '6px' }}
                      onClick={() => navigate(`/don-hang/${order._id}`)}
                    >
                      Thanh toán cọc ⚡
                    </button>
                  )}
                  {canPayRemaining && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary fw-bold"
                      style={{ borderRadius: '6px' }}
                      onClick={() => navigate(`/don-hang/${order._id}`)}
                    >
                      Thanh toán số dư 70% ⚡
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontWeight: 600, borderRadius: '6px' }}
                    onClick={() => navigate(`/don-hang/${order._id}`)}
                  >
                    Chi tiết &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default UserOrdersList;
