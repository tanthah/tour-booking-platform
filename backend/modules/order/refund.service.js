const Refund = require('./refund.model');
const Order = require('./order.model');
const OrderLog = require('./orderLog.model');

/**
 * Refund Service — Quản lý quy trình hoàn tiền theo 4 trạng thái
 * PENDING → PROCESSING → COMPLETED / FAILED
 */

const createRefund = async (orderId, userId, refundAmount, refundMethod, note = '') => {
  if (refundAmount <= 0) return null;

  const refund = await Refund.create({
    order_id: orderId,
    user_id: userId,
    refund_amount: refundAmount,
    refund_method: refundMethod || 'COUNTER',
    status: 'PENDING',
    note: note || 'Yêu cầu hoàn tiền tự động khi hủy đơn',
  });

  await OrderLog.create({
    order_id: orderId,
    action: 'REFUND_CREATED',
    description: `Tạo yêu cầu hoàn tiền: ${refundAmount.toLocaleString('vi-VN')} đ qua ${refundMethod || 'COUNTER'}.`,
    metadata: { refund_id: refund._id, refund_amount: refundAmount },
  });

  return refund;
};

const processRefund = async (refundId, staffId) => {
  const refund = await Refund.findById(refundId);
  if (!refund) {
    const err = new Error('Yêu cầu hoàn tiền không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (refund.status !== 'PENDING') {
    const err = new Error('Chỉ có thể xử lý yêu cầu hoàn tiền đang ở trạng thái Chờ duyệt (PENDING).');
    err.statusCode = 400;
    throw err;
  }

  refund.status = 'PROCESSING';
  refund.approved_at = new Date();
  refund.approved_by = staffId;
  await refund.save();

  await OrderLog.create({
    order_id: refund.order_id,
    performed_by: staffId,
    action: 'REFUND_PROCESSING',
    description: 'Nhân viên đã duyệt và đang tiến hành hoàn tiền cho khách hàng.',
    metadata: { refund_id: refund._id },
  });

  return refund;
};

const completeRefund = async (refundId, staffId, transactionId = null) => {
  const refund = await Refund.findById(refundId);
  if (!refund) {
    const err = new Error('Yêu cầu hoàn tiền không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (refund.status !== 'PROCESSING') {
    const err = new Error('Chỉ có thể hoàn thành yêu cầu hoàn tiền đang xử lý (PROCESSING).');
    err.statusCode = 400;
    throw err;
  }

  refund.status = 'COMPLETED';
  refund.completed_at = new Date();
  if (transactionId) refund.transaction_id = transactionId;
  await refund.save();

  // Đổi trạng thái thanh toán của đơn thành REFUNDED
  await Order.findByIdAndUpdate(refund.order_id, { $set: { payment_status: 'REFUNDED' } });

  await OrderLog.create({
    order_id: refund.order_id,
    performed_by: staffId,
    action: 'REFUND_COMPLETED',
    description: `Hoàn tiền thành công: ${refund.refund_amount.toLocaleString('vi-VN')} đ.${transactionId ? ` Mã GD: ${transactionId}` : ''}`,
    metadata: { refund_id: refund._id, transaction_id: transactionId },
  });

  return refund;
};

const failRefund = async (refundId, staffId, note = '') => {
  const refund = await Refund.findById(refundId);
  if (!refund) {
    const err = new Error('Yêu cầu hoàn tiền không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  refund.status = 'FAILED';
  if (note) refund.note = note;
  await refund.save();

  await OrderLog.create({
    order_id: refund.order_id,
    performed_by: staffId,
    action: 'REFUND_FAILED',
    description: `Hoàn tiền thất bại: ${note || 'Không xác định'}`,
    metadata: { refund_id: refund._id, note },
  });

  return refund;
};

const getRefundsByOrder = async (orderId) => {
  return Refund.find({ order_id: orderId })
    .populate('approved_by', 'full_name email')
    .sort({ created_at: -1 })
    .lean();
};

const getAllRefundsAdmin = async (queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (queryParams.status) filter.status = queryParams.status;

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate('order_id', 'order_code total_amount paid_amount customer_info')
      .populate('user_id', 'full_name email phone')
      .populate('approved_by', 'full_name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Refund.countDocuments(filter),
  ]);

  return { refunds, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = {
  createRefund,
  processRefund,
  completeRefund,
  failRefund,
  getRefundsByOrder,
  getAllRefundsAdmin,
};

