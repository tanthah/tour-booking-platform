import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, MessageSquare, Clock } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

const statusBadge = (status) => {
  const map = {
    PENDING_PAYMENT: { bg: '#fef3c7', color: '#92400e', text: 'Chờ thanh toán' },
    DEPOSIT_CONFIRMED: { bg: '#e0f2fe', color: '#0369a1', text: 'Đã cọc 30%' },
    CONFIRMED: { bg: '#dbeafe', color: '#1e40af', text: 'Đã xác nhận' },
    AWAITING_STAFF: { bg: '#fee2e2', color: '#b91c1c', text: '⚠️ Chờ xử lý' },
    COMPLETED: { bg: '#dcfce7', color: '#166534', text: 'Hoàn thành' },
    CANCELLED: { bg: '#f1f5f9', color: '#64748b', text: 'Đã hủy' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#334155', text: status };
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{s.text}</span>;
};

const paymentBadge = (status) => {
  const map = {
    PENDING: { bg: '#f1f5f9', color: '#475569', text: 'Chưa TT' },
    DEPOSIT_PAID: { bg: '#e0f2fe', color: '#0369a1', text: 'Đã cọc 30%' },
    PAID: { bg: '#dcfce7', color: '#166534', text: 'Đã TT đủ' },
    FAILED: { bg: '#fee2e2', color: '#991b1b', text: 'Thất bại' },
    REFUNDED: { bg: '#e0e7ff', color: '#3730a3', text: 'Hoàn tiền' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#334155', text: status };
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{s.text}</span>;
};

function OrderDetailModal({ order, updating, onClose, onUpdateStatus }) {
  const [refunds, setRefunds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState('INFO');
  const [localUpdating, setLocalUpdating] = useState(false);

  const fetchExtraData = useCallback(async () => {
    try {
      const [refRes, logRes] = await Promise.all([
        axiosAdmin.get(`/orders/${order._id}/refunds`).catch(() => ({ data: [] })),
        axiosAdmin.get(`/orders/${order._id}/logs`).catch(() => ({ data: [] })),
      ]);
      setRefunds(refRes.data || []);
      setLogs(logRes.data || []);
    } catch {
      // ignore
    }
  }, [order._id]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchExtraData(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchExtraData]);

  const handleConfirmDeposit = async () => {
    if (!window.confirm('Xác nhận đã nhận tiền đặt cọc 30% cho đơn này?')) return;
    try {
      setLocalUpdating(true);
      await axiosAdmin.patch(`/orders/admin/${order._id}/confirm-deposit`);
      alert('Đã xác nhận đặt cọc thành công!');
      onClose();
    } catch (err) {
      alert(err.message || 'Lỗi khi xác nhận cọc');
    } finally {
      setLocalUpdating(false);
    }
  };

  const handleCompanyCancel = async () => {
    const reason = window.prompt('Nhập lý do công ty hủy tour:', 'Công ty thông báo hủy tour');
    if (!reason) return;
    try {
      setLocalUpdating(true);
      await axiosAdmin.patch(`/orders/admin/${order._id}/company-cancel`, { cancel_reason: reason });
      alert('Đã hủy tour và tạo yêu cầu hoàn 100% thành công!');
      onClose();
    } catch (err) {
      alert(err.message || 'Lỗi khi hủy tour');
    } finally {
      setLocalUpdating(false);
    }
  };

  const handleResolve = async (action) => {
    let payload = { action };
    if (action === 'EXTEND') {
      const newDeadline = window.prompt('Nhập hạn thanh toán mới (YYYY-MM-DD):');
      if (!newDeadline) return;
      payload.new_deadline = newDeadline;
    } else if (action === 'CANCEL') {
      const reason = window.prompt('Lý do hủy đơn quá hạn:', 'Quá hạn thanh toán');
      payload.cancel_reason = reason;
    }
    try {
      setLocalUpdating(true);
      await axiosAdmin.patch(`/orders/admin/${order._id}/resolve`, payload);
      alert('Xử lý đơn quá hạn thành công!');
      onClose();
    } catch (err) {
      alert(err.message || 'Lỗi khi xử lý đơn');
    } finally {
      setLocalUpdating(false);
    }
  };

  const handleRefundAction = async (refundId, action) => {
    let transactionId = null;
    let note = null;
    if (action === 'complete') {
      transactionId = window.prompt('Mã giao dịch hoàn tiền (nếu có):') || '';
    } else if (action === 'fail') {
      note = window.prompt('Lý do hoàn tiền thất bại:') || '';
    }
    try {
      setLocalUpdating(true);
      await axiosAdmin.patch(`/orders/admin/refunds/${refundId}/${action}`, { transaction_id: transactionId, note });
      alert('Cập nhật hoàn tiền thành công!');
      fetchExtraData();
    } catch (err) {
      alert(err.message || 'Lỗi khi thao tác hoàn tiền');
    } finally {
      setLocalUpdating(false);
    }
  };

  const handleZaloPayRefund = async (refundId) => {
    if (!window.confirm('Xác nhận thực hiện hoàn tiền tự động qua cổng ZaloPay API?')) return;
    try {
      setLocalUpdating(true);
      const res = await axiosAdmin.post(`/payments/admin/refunds/${refundId}`);
      alert(`Hoàn tiền ZaloPay thành công! Mã ZaloPay: ${res?.data?.zp_refund_id || 'Đã ghi nhận'}`);
      fetchExtraData();
    } catch (err) {
      alert(err.message || 'Lỗi khi hoàn tiền qua ZaloPay');
    } finally {
      setLocalUpdating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      setLocalUpdating(true);
      await axiosAdmin.post(`/orders/admin/${order._id}/notes`, { content: noteContent.trim() });
      setNoteContent('');
      fetchExtraData();
    } catch (err) {
      alert(err.message || 'Lỗi thêm ghi chú');
    } finally {
      setLocalUpdating(false);
    }
  };

  const isPending = order.order_status === 'PENDING_PAYMENT';
  const isAwaitingStaff = order.order_status === 'AWAITING_STAFF';

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '780px', width: '95%', maxHeight: '90vh', overflow: 'auto', padding: '28px', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={22} color="#64748b" />
      </button>

      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
        Đơn hàng: <span style={{ color: '#ea580c' }}>{order.order_code}</span>
      </h2>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
        Ngày tạo: {new Date(order.created_at).toLocaleString('vi-VN')} | TT: {statusBadge(order.order_status)} {paymentBadge(order.payment_status)}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('INFO')} style={{ padding: '8px 14px', border: 'none', background: 'none', fontWeight: activeTab === 'INFO' ? 700 : 400, borderBottom: activeTab === 'INFO' ? '2px solid #ea580c' : 'none', cursor: 'pointer' }}>Chi tiết</button>
        <button onClick={() => setActiveTab('REFUNDS')} style={{ padding: '8px 14px', border: 'none', background: 'none', fontWeight: activeTab === 'REFUNDS' ? 700 : 400, borderBottom: activeTab === 'REFUNDS' ? '2px solid #ea580c' : 'none', cursor: 'pointer' }}>Hoàn tiền ({refunds.length})</button>
        <button onClick={() => setActiveTab('LOGS')} style={{ padding: '8px 14px', border: 'none', background: 'none', fontWeight: activeTab === 'LOGS' ? 700 : 400, borderBottom: activeTab === 'LOGS' ? '2px solid #ea580c' : 'none', cursor: 'pointer' }}>Nhật ký ({logs.length})</button>
      </div>

      {activeTab === 'INFO' && (
        <>
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Khách đặt: {order.customer_info?.full_name} | {order.customer_info?.phone}</div>
            {order.customer_info?.email && <div>Email: {order.customer_info.email}</div>}
            {order.customer_info?.note && <div style={{ color: '#64748b' }}>Ghi chú: {order.customer_info.note}</div>}
          </div>

          <div style={{ marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Tour ({order.items?.length || 0})</div>
            {order.items?.map((it) => (
              <div key={it._id} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '6px' }}>
                <strong>{it.tour_name}</strong> | {it.quantity} khách | <span style={{ color: '#ea580c', fontWeight: 700 }}>{(it.subtotal || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Tổng đơn:</span><strong>{(order.total_amount || 0).toLocaleString('vi-VN')} đ</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '4px' }}><span>Đã thanh toán:</span><strong>{(order.paid_amount || 0).toLocaleString('vi-VN')} đ</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '4px' }}><span>Còn nợ:</span><strong>{(order.remaining_amount || 0).toLocaleString('vi-VN')} đ</strong></div>
            {order.payment_deadline && <div style={{ color: '#ea580c', fontSize: '12.5px', marginTop: '4px' }}>Hạn thanh toán 100%: {new Date(order.payment_deadline).toLocaleDateString('vi-VN')} (D-16)</div>}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isPending && (
              <>
                <button className="btn btn-warning btn-sm" disabled={updating || localUpdating} onClick={handleConfirmDeposit}>Xác nhận cọc 30%</button>
                <button className="btn btn-primary btn-sm" disabled={updating || localUpdating} onClick={() => onUpdateStatus(order._id, { payment_status: 'PAID' })}><CheckCircle size={14} /> Xác nhận đủ 100%</button>
              </>
            )}
            {order.order_status === 'DEPOSIT_CONFIRMED' && (
              <button className="btn btn-primary btn-sm" disabled={updating || localUpdating} onClick={() => onUpdateStatus(order._id, { payment_status: 'PAID' })}><CheckCircle size={14} /> Xác nhận đủ 100%</button>
            )}
            {isAwaitingStaff && (
              <div style={{ display: 'flex', gap: '6px', background: '#fef2f2', padding: '8px', borderRadius: '8px', width: '100%' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>Xử lý quá hạn:</span>
                <button className="btn btn-outline-primary btn-sm" onClick={() => handleResolve('EXTEND')}>Gia hạn</button>
                <button className="btn btn-outline-success btn-sm" onClick={() => handleResolve('CONFIRM_PAID')}>Xác nhận đủ</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleResolve('CANCEL')}>Hủy đơn</button>
              </div>
            )}
            {['PENDING_PAYMENT', 'DEPOSIT_CONFIRMED', 'CONFIRMED'].includes(order.order_status) && (
              <button className="btn btn-outline-danger btn-sm" disabled={updating || localUpdating} onClick={handleCompanyCancel}>Công ty hủy tour (Hoàn 100%)</button>
            )}
            {order.order_status === 'CONFIRMED' && (
              <button className="btn btn-success btn-sm" disabled={updating || localUpdating} onClick={() => onUpdateStatus(order._id, { order_status: 'COMPLETED' })}>Hoàn thành</button>
            )}
          </div>
        </>
      )}

      {activeTab === 'REFUNDS' && (
        <div style={{ fontSize: '13px' }}>
          {refunds.length === 0 ? <p>Chưa có yêu cầu hoàn tiền nào cho đơn này.</p> : refunds.map((rf) => (
            <div key={rf._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong>Hoàn: <span style={{ color: '#ea580c' }}>{rf.refund_amount.toLocaleString('vi-VN')} đ</span></strong>
                <span style={{ fontWeight: 700 }}>{rf.status}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px' }}>Phương thức: {rf.refund_method} | Tạo: {new Date(rf.created_at).toLocaleString('vi-VN')}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {rf.status === 'PENDING' && (
                  <>
                    <button className="btn btn-outline-primary btn-sm" disabled={localUpdating} onClick={() => handleZaloPayRefund(rf._id)}>Hoàn tiền ZaloPay Gateway ⚡</button>
                    <button className="btn btn-secondary btn-sm" disabled={localUpdating} onClick={() => handleRefundAction(rf._id, 'process')}>Duyệt thủ công</button>
                  </>
                )}
                {rf.status === 'PROCESSING' && (
                  <>
                    <button className="btn btn-outline-primary btn-sm" disabled={localUpdating} onClick={() => handleZaloPayRefund(rf._id)}>Hoàn tiền ZaloPay Gateway ⚡</button>
                    <button className="btn btn-success btn-sm" disabled={localUpdating} onClick={() => handleRefundAction(rf._id, 'complete')}>Hoàn tất</button>
                    <button className="btn btn-danger btn-sm" disabled={localUpdating} onClick={() => handleRefundAction(rf._id, 'fail')}>Thất bại</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div style={{ fontSize: '13px' }}>
          <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input type="text" className="form-control form-control-sm" placeholder="Thêm ghi chú nội bộ..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={localUpdating || !noteContent.trim()}><MessageSquare size={14} /> Lưu</button>
          </form>
          {logs.map((l) => (
            <div key={l._id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
                <span><strong>{l.action}</strong> {l.performed_by?.full_name ? `(${l.performed_by.full_name})` : '(Hệ thống)'}</span>
                <span><Clock size={12} /> {new Date(l.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div style={{ marginTop: '2px' }}>{l.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderDetailModal;
