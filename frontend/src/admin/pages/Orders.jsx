import { useState, useEffect, useCallback } from 'react';
import { Eye, Search, RefreshCw } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import OrderDetailModal from '../components/OrderDetailModal';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'PENDING', label: 'Chưa thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

const statusBadge = (status) => {
  const map = {
    PENDING_PAYMENT: { bg: '#fef3c7', color: '#92400e', text: 'Chờ thanh toán' },
    CONFIRMED: { bg: '#dbeafe', color: '#1e40af', text: 'Đã xác nhận' },
    COMPLETED: { bg: '#dcfce7', color: '#166534', text: 'Hoàn thành' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b', text: 'Đã hủy' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#334155', text: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
      {s.text}
    </span>
  );
};

const paymentBadge = (status) => {
  const map = {
    PENDING: { bg: '#f1f5f9', color: '#475569', text: 'Chưa TT' },
    PAID: { bg: '#dcfce7', color: '#166534', text: 'Đã TT' },
    FAILED: { bg: '#fee2e2', color: '#991b1b', text: 'Thất bại' },
    REFUNDED: { bg: '#e0e7ff', color: '#3730a3', text: 'Hoàn tiền' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#334155', text: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
      {s.text}
    </span>
  );
};

/**
 * Orders - Trang quản lý Đơn hàng cho Admin/Staff
 * Hiển thị danh sách đơn, phân trang, lọc theo trạng thái, tìm kiếm, cập nhật trạng thái
 */
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterStatus) params.order_status = filterStatus;
      if (filterPayment) params.payment_status = filterPayment;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axiosAdmin.get('/orders/admin/list', { params });
      setOrders(res.data?.orders || []);
      setPagination(res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      alert(error.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPayment, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchOrders(1); }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleViewDetail = async (orderId) => {
    try {
      const res = await axiosAdmin.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (error) {
      alert(error.message || 'Không thể tải chi tiết đơn hàng');
    }
  };

  const handleUpdateStatus = async (orderId, statusData) => {
    if (!window.confirm('Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này?')) return;
    try {
      setUpdating(true);
      await axiosAdmin.patch(`/orders/admin/${orderId}`, statusData);
      alert('Cập nhật trạng thái thành công!');
      setSelectedOrder(null);
      fetchOrders(pagination.page);
    } catch (error) {
      alert(error.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý Đơn hàng</h1>
        <button className="btn btn-primary" onClick={() => fetchOrders(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchOrders(1); }}
              style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
            {PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Bảng danh sách đơn hàng */}
      <div className="card">
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Tổng tiền</th>
                  <th>Đơn hàng</th>
                  <th>Thanh toán</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Không có đơn hàng nào</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{order.order_code}</td>
                      <td>{order.customer_info?.full_name || 'N/A'}</td>
                      <td>{order.customer_info?.phone || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: '#ea580c' }}>{(order.total_amount || 0).toLocaleString('vi-VN')} đ</td>
                      <td>{statusBadge(order.order_status)}</td>
                      <td>{paymentBadge(order.payment_status)}</td>
                      <td style={{ fontSize: '12.5px', color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn" title="Xem chi tiết" onClick={() => handleViewDetail(order._id)}>
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchOrders(p)}
                style={{
                  padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  background: p === pagination.page ? '#3b82f6' : '#ffffff', color: p === pagination.page ? '#ffffff' : '#334155',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Chi tiết Đơn hàng */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OrderDetailModal
            order={selectedOrder}
            updating={updating}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      )}
    </div>
  );
}

export default Orders;
