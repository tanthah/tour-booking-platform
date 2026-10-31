const Payment = require('./payment.model');
const Order = require('../order/order.model');
const OrderLog = require('../order/orderLog.model');
const Refund = require('../order/refund.model');
const {
  refundZaloPayTransaction,
  getYYMMDD,
  getConfig,
} = require('./zalopay.service');
const { releaseSlotsForOrder } = require('../order/order.helper');

/**
 * Xử lý hoàn tiền qua ZaloPay API (chỉ Admin)
 */
async function processZaloPayRefund({ cancellationId, adminId, notes }) {
  let refund = await Refund.findById(cancellationId);
  if (!refund) {
    refund = await Refund.findOne({ order_id: cancellationId });
  }

  if (!refund) {
    const err = new Error('Không tìm thấy yêu cầu hoàn tiền tương ứng.');
    err.statusCode = 404;
    throw err;
  }

  if (refund.status === 'COMPLETED') {
    const err = new Error('Yêu cầu hoàn tiền này đã được hoàn thành trước đó.');
    err.statusCode = 400;
    throw err;
  }

  const successfulPayment = await Payment.findOne({
    order_id: refund.order_id,
    status: 'success',
    zp_trans_id: { $exists: true, $ne: null },
  }).sort({ paid_at: -1 });

  if (!successfulPayment) {
    const err = new Error('Không tìm thấy giao dịch ZaloPay thành công của đơn hàng này để hoàn tiền.');
    err.statusCode = 400;
    throw err;
  }

  const config = getConfig();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const m_refund_id = `${getYYMMDD()}_${config.app_id}_${randomNum}`;

  const refundRes = await refundZaloPayTransaction({
    m_refund_id,
    zp_trans_id: successfulPayment.zp_trans_id,
    amount: refund.refund_amount,
    description: notes || `Hoàn tiền tour - Đơn hàng #${refund.order_id}`,
  });

  if (refundRes.return_code === 1 || refundRes.return_code === 3) {
    refund.status = refundRes.return_code === 1 ? 'COMPLETED' : 'PROCESSING';
    refund.transaction_id = refundRes.zp_refund_id ? String(refundRes.zp_refund_id) : m_refund_id;
    refund.approved_by = adminId;
    refund.approved_at = new Date();
    if (refundRes.return_code === 1) refund.completed_at = new Date();
    if (notes) refund.note = notes;
    await refund.save();

    await Order.findByIdAndUpdate(refund.order_id, {
      $set: { payment_status: 'REFUNDED' },
    });

    await OrderLog.create({
      order_id: refund.order_id,
      performed_by: adminId,
      action: refundRes.return_code === 1 ? 'REFUND_COMPLETED' : 'REFUND_PROCESSING',
      description: `Hoàn tiền ZaloPay ${refundRes.return_code === 1 ? 'thành công' : 'đang xử lý'}: ${refund.refund_amount.toLocaleString('vi-VN')} đ.`,
      metadata: { m_refund_id, zp_refund_id: refundRes.zp_refund_id, amount: refund.refund_amount },
    });

    return {
      refund,
      zp_refund_id: refundRes.zp_refund_id,
      return_code: refundRes.return_code,
      return_message: refundRes.return_message,
    };
  }

  const err = new Error(`Hoàn tiền thất bại từ ZaloPay: ${refundRes.return_message || 'Lỗi không xác định'}`);
  err.statusCode = 400;
  throw err;
}

/**
 * Quét và giải phóng các giao dịch pending đã hết hạn 15 phút
 */
async function expirePendingPayments() {
  const expiredPayments = await Payment.find({
    status: 'pending',
    expires_at: { $lte: new Date() },
  });

  for (const p of expiredPayments) {
    p.status = 'expired';
    await p.save();

    const order = await Order.findById(p.order_id);
    if (order && order.order_status === 'PENDING_PAYMENT' && (!order.paid_amount || order.paid_amount === 0)) {
      try {
        await releaseSlotsForOrder(order);
      } catch {
        // Tiếp tục giải phóng
      }
      await OrderLog.create({
        order_id: order._id,
        action: 'PAYMENT_EXPIRED',
        description: `Giao dịch ZaloPay #${p.app_trans_id} đã hết hạn 15 phút. Hệ thống giải phóng chỗ giữ tạm.`,
        metadata: { app_trans_id: p.app_trans_id },
      });
    }
  }
}

module.exports = {
  processZaloPayRefund,
  expirePendingPayments,
};

