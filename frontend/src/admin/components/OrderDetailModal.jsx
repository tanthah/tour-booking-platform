import { X, CheckCircle } from 'lucide-react';

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
 * OrderDetailModal - Modal xem chi tiết & cập nhật trạng thái đơn hàng (Admin)
 */
function OrderDetailModal({ order, updating, onClose, onUpdateStatus }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '720px', width: '95%', maxHeight: '90vh', overflow: 'auto', padding: '28px', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={22} color="#64748b" />
      </button>

      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
        Đơn hàng: <span style={{ color: '#ea580c' }}>{order.order_code}</span>
      </h2>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        Ngày tạo: {new Date(order.created_at).toLocaleString('vi-VN')} | Phương thức: <strong>{order.payment_method}</strong>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {statusBadge(order.order_status)} {paymentBadge(order.payment_status)}
      </div>

      {/* Thông tin khách đặt */}
      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Người Đặt</div>
        <div style={{ fontSize: '13px' }}>
          {order.customer_info?.full_name} | {order.customer_info?.phone}
          {order.customer_info?.email ? ` | ${order.customer_info.email}` : ''}
        </div>
        {order.customer_info?.note && (
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>Ghi chú: {order.customer_info.note}</div>
        )}
      </div>

      {/* Tour Items */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Tour Trong Đơn ({order.items?.length || 0})</div>
        {order.items?.map((item) => (
          <div key={item._id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
            <strong>{item.tour_name}</strong> ({item.tour_code})
            <br />
            {item.quantity_adult} lớn × {item.price_adult?.toLocaleString('vi-VN')}đ
            {item.quantity_child > 0 ? ` | ${item.quantity_child} trẻ × ${item.price_child?.toLocaleString('vi-VN')}đ` : ''}
            {item.quantity_baby > 0 ? ` | ${item.quantity_baby} bé × ${item.price_baby?.toLocaleString('vi-VN')}đ` : ''}
            <span style={{ float: 'right', fontWeight: 700, color: '#ea580c' }}>{item.subtotal?.toLocaleString('vi-VN')} đ</span>
          </div>
        ))}
      </div>

      {/* Khách đi tour */}
      {order.booking_customers?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Khách Đi Tour ({order.booking_customers.length})</div>
          <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Họ tên</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>SĐT</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Giới tính</th>
            </tr></thead>
            <tbody>
              {order.booking_customers.map((c, i) => (
                <tr key={c._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{c.full_name}</td>
                  <td style={{ padding: '6px 8px' }}>{c.phone}</td>
                  <td style={{ padding: '6px 8px' }}>{c.gender === 'MALE' ? 'Nam' : c.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tổng tiền */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
          <span>Tạm tính:</span><span>{(order.subtotal || 0).toLocaleString('vi-VN')} đ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
          <span>Giảm giá:</span><span style={{ color: '#16a34a' }}>-{(order.discount_amount || 0).toLocaleString('vi-VN')} đ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 800 }}>
          <span>Tổng tiền:</span><span style={{ color: '#ea580c' }}>{(order.total_amount || 0).toLocaleString('vi-VN')} đ</span>
        </div>
      </div>

      {/* Nút hành động */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {order.order_status === 'PENDING_PAYMENT' && (
          <button
            className="btn btn-primary"
            disabled={updating}
            onClick={() => onUpdateStatus(order._id, { payment_status: 'PAID' })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
          >
            <CheckCircle size={16} /> {updating ? 'Đang xử lý...' : 'Xác nhận Đã Thanh Toán'}
          </button>
        )}
        {order.order_status === 'CONFIRMED' && (
          <button
            className="btn btn-success"
            disabled={updating}
            onClick={() => onUpdateStatus(order._id, { order_status: 'COMPLETED' })}
            style={{ borderRadius: '8px' }}
          >
            {updating ? 'Đang xử lý...' : 'Đánh dấu Hoàn Thành'}
          </button>
        )}
        {order.order_status !== 'CANCELLED' && order.order_status !== 'COMPLETED' && (
          <button
            className="btn btn-outline-danger"
            disabled={updating}
            onClick={() => onUpdateStatus(order._id, { order_status: 'CANCELLED', cancel_reason: 'Admin hủy đơn' })}
            style={{ borderRadius: '8px' }}
          >
            {updating ? 'Đang xử lý...' : 'Hủy Đơn'}
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderDetailModal;
