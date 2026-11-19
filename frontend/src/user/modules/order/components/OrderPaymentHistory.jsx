import { Badge } from 'react-bootstrap';

const OrderPaymentHistory = ({ payments = [], refunds = [] }) => {
  if (payments.length === 0 && refunds.length === 0) return null;

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
        Lịch Sử Thanh Toán & Hoàn Tiền
      </h3>

      {/* Lịch sử giao dịch thanh toán ZaloPay */}
      {payments.map((pm) => (
        <div key={pm._id} className="p-3 mb-2 rounded border" style={{ background: '#f8fafc', fontSize: '13px' }}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>
              {pm.payment_type === 'deposit' ? 'Đợt 1 (Đặt cọc 30%)' : pm.payment_type === 'remaining' ? 'Đợt 2 (Số dư 70%)' : 'Thanh toán 100%'}:&nbsp;
              <span style={{ color: '#0068ff', fontSize: '15px' }}>{pm.amount.toLocaleString('vi-VN')} đ</span>
            </strong>
            <Badge bg={pm.status === 'success' ? 'success' : pm.status === 'pending' ? 'warning' : pm.status === 'expired' ? 'secondary' : 'danger'}>
              {pm.status === 'success' ? 'Thành công' : pm.status === 'pending' ? 'Đang chờ' : pm.status === 'expired' ? 'Hết hạn' : 'Thất bại'}
            </Badge>
          </div>
          <div style={{ color: '#64748b' }}>
            Cổng: ZaloPay | Mã GD: <strong>{pm.app_trans_id}</strong>
            {pm.zp_trans_id && ` (Mã ZaloPay: ${pm.zp_trans_id})`}
          </div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>
            Thời gian: {new Date(pm.createdAt).toLocaleString('vi-VN')}
            {pm.paid_at && ` | Đã nhận: ${new Date(pm.paid_at).toLocaleString('vi-VN')}`}
          </div>
        </div>
      ))}

      {/* Lịch sử hoàn tiền */}
      {refunds.map((rf) => (
        <div key={rf._id} className="p-3 mb-2 rounded border" style={{ background: '#fef2f2', fontSize: '13px' }}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>
              Hoàn tiền:&nbsp;
              <span style={{ color: '#ea580c', fontSize: '15px' }}>{rf.refund_amount.toLocaleString('vi-VN')} đ</span>
            </strong>
            <Badge bg={rf.status === 'COMPLETED' ? 'success' : rf.status === 'PROCESSING' ? 'warning' : rf.status === 'FAILED' ? 'danger' : 'secondary'}>
              {rf.status === 'COMPLETED' ? 'Đã hoàn' : rf.status === 'PROCESSING' ? 'Đang hoàn' : rf.status === 'PENDING' ? 'Chờ duyệt' : 'Thất bại'}
            </Badge>
          </div>
          <div style={{ color: '#64748b' }}>
            Phương thức: {rf.refund_method} | Tạo lúc: {new Date(rf.created_at).toLocaleString('vi-VN')}
          </div>
          {rf.transaction_id && <div>Mã GD hoàn tiền: <strong>{rf.transaction_id}</strong></div>}
        </div>
      ))}
    </div>
  );
};

export default OrderPaymentHistory;

