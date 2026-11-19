import { useState, useEffect, useCallback } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import axiosAdmin from '../../..//config/axiosAdmin';
import OrderDetailModal from '../components/OrderDetailModal';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
  StatusBadge,
  ActionButtons,
} from '../../..//components/common';

const ORDER_STATUS_MAP = {
  PENDING_PAYMENT: { bg: '#fef3c7', color: '#92400e', label: 'Chờ thanh toán' },
  DEPOSIT_CONFIRMED: { bg: '#e0f2fe', color: '#0369a1', label: 'Đã cọc 30%' },
  CONFIRMED: { bg: '#dbeafe', color: '#1e40af', label: 'Đã xác nhận' },
  AWAITING_STAFF: { bg: '#fee2e2', color: '#b91c1c', label: '⚠️ Chờ xử lý' },
  COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Hoàn thành' },
  CANCELLED: { bg: '#f1f5f9', color: '#64748b', label: 'Đã hủy' },
};

const PAYMENT_STATUS_MAP = {
  PENDING: { bg: '#f1f5f9', color: '#475569', label: 'Chưa TT' },
  DEPOSIT_PAID: { bg: '#e0f2fe', color: '#0369a1', label: 'Đã cọc 30%' },
  PAID: { bg: '#dcfce7', color: '#166534', label: 'Đã TT đủ' },
  FAILED: { bg: '#fee2e2', color: '#991b1b', label: 'Thất bại' },
  REFUNDED: { bg: '#e0e7ff', color: '#3730a3', label: 'Hoàn tiền' },
};

const STATUS_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'DEPOSIT_CONFIRMED', label: 'Đã cọc 30%' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'AWAITING_STAFF', label: 'Chờ xử lý (quá hạn)' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const PAYMENT_OPTIONS = [
  { value: 'PENDING', label: 'Chưa thanh toán' },
  { value: 'DEPOSIT_PAID', label: 'Đã nhận cọc' },
  { value: 'PAID', label: 'Đã thanh toán đủ' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

/**
 * Orders - Trang quản lý Đơn hàng cho Admin/Staff
 */
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async (page = 1, limit = pagination.limit || 10) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (filterStatus) params.order_status = filterStatus;
      if (filterPayment) params.payment_status = filterPayment;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axiosAdmin.get('/orders/admin/list', { params });
      setOrders(res.data?.orders || []);
      setPagination(
        res.data?.pagination || { page, limit, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPayment, searchTerm, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterPayment('');
    fetchOrders(1);
  };

  const handleViewDetail = async (orderId) => {
    try {
      const res = await axiosAdmin.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      alert(err.message || 'Không thể tải chi tiết đơn hàng');
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
    } catch (err) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: 'order_code',
      title: 'Mã đơn',
      width: '130px',
      render: (order) => (
        <span style={{ fontWeight: 700, color: '#1e293b' }}>
          {order.order_code}
        </span>
      ),
    },
    {
      key: 'customer_name',
      title: 'Khách hàng',
      render: (order) => order.customer_info?.full_name || 'N/A',
    },
    {
      key: 'customer_phone',
      title: 'Số điện thoại',
      width: '130px',
      render: (order) => order.customer_info?.phone || 'N/A',
    },
    {
      key: 'total_amount',
      title: 'Tổng tiền',
      width: '150px',
      render: (order) => (
        <span style={{ fontWeight: 700, color: 'var(--danger-color)' }}>
          {(order.total_amount || 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'order_status',
      title: 'Đơn hàng',
      width: '150px',
      render: (order) => (
        <StatusBadge status={order.order_status} statusMap={ORDER_STATUS_MAP} />
      ),
    },
    {
      key: 'payment_status',
      title: 'Thanh toán',
      width: '140px',
      render: (order) => (
        <StatusBadge status={order.payment_status} statusMap={PAYMENT_STATUS_MAP} />
      ),
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      width: '120px',
      render: (order) => (
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          {new Date(order.created_at).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Hành động',
      width: '100px',
      align: 'center',
      render: (order) => (
        <ActionButtons
          actions={[
            {
              key: 'view',
              icon: Eye,
              title: 'Xem chi tiết đơn hàng',
              onClick: () => handleViewDetail(order._id),
              variant: 'view',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Quản lý Đơn hàng"
        subtitle="Theo dõi, tra cứu trạng thái thanh toán và xử lý đơn đặt tour của khách hàng"
        actions={
          <button className="btn btn-secondary" onClick={() => fetchOrders(pagination.page)} title="Làm mới danh sách">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Làm mới</span>
          </button>
        }
      />

      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm mã đơn, tên khách, SĐT..."
        onSearchSubmit={() => fetchOrders(1)}
        filters={[
          {
            key: 'order_status',
            value: filterStatus,
            onChange: (val) => setFilterStatus(val),
            placeholder: 'Tất cả trạng thái',
            options: STATUS_OPTIONS,
            width: '180px',
          },
          {
            key: 'payment_status',
            value: filterPayment,
            onChange: (val) => setFilterPayment(val),
            placeholder: 'Tất cả thanh toán',
            options: PAYMENT_OPTIONS,
            width: '180px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      <AdminDataTable
        columns={columns}
        data={orders}
        loading={loading}
        error={error}
        emptyText="Không tìm thấy đơn hàng nào."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchOrders(p, pagination.limit)}
        onPageSizeChange={(newLimit) => fetchOrders(1, newLimit)}
      />

      {/* Modal Chi tiết Đơn hàng (Giữ nguyên toàn bộ logic & component) */}
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
