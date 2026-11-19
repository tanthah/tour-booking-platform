const Order = require('./order.model');
const OrderLog = require('./orderLog.model');
const couponService = require('../coupon/coupon.service');
const refundService = require('./refund.service');
const { confirmSlotsForOrder, releaseSlotsForOrder } = require('./order.helper');
const { getCancelFeePercent, calculateRefundAmount } = require('./booking.policy');

const getAllOrdersAdmin = async (queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (queryParams.order_status) filter.order_status = queryParams.order_status;
  if (queryParams.payment_status) filter.payment_status = queryParams.payment_status;
  if (queryParams.search) {
    filter.$or = [
      { order_code: { $regex: queryParams.search, $options: 'i' } },
      { 'customer_info.full_name': { $regex: queryParams.search, $options: 'i' } },
      { 'customer_info.phone': { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).select('-booking_customers.id_number').sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updateOrderStatus = async (orderId, statusData, staffId = null) => {
  const { order_status, payment_status, cancel_reason } = statusData;
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (payment_status === 'PAID') {
    order.payment_status = 'PAID';
    order.order_status = 'CONFIRMED';
    order.paid_amount = order.total_amount;
    order.remaining_amount = 0;
    await order.save();
    await confirmSlotsForOrder(order);
    await couponService.confirmCouponUsed(order._id);
    await OrderLog.create({
      order_id: order._id,
      performed_by: staffId,
      action: 'FULL_PAID',
      description: 'Xác nhận thanh toán đủ 100%, tour đã được chốt chỗ thành công.',
      metadata: { paid_amount: order.total_amount },
    });
    return order;
  }

  if (order_status === 'CANCELLED') {
    order.order_status = 'CANCELLED';
    order.cancel_reason = cancel_reason || 'Admin hủy đơn';
    order.cancel_type = 'STAFF';
    await order.save();
    await releaseSlotsForOrder(order);
    await couponService.releaseCouponReservation(order._id);
    await OrderLog.create({
      order_id: order._id,
      performed_by: staffId,
      action: 'STATUS_CHANGED',
      description: `Đơn hàng đã bị hủy bởi nhân viên: ${order.cancel_reason}`,
    });
    return order;
  }

  if (payment_status) order.payment_status = payment_status;
  if (order_status) order.order_status = order_status;
  if (cancel_reason) order.cancel_reason = cancel_reason;
  await order.save();

  await OrderLog.create({
    order_id: order._id,
    performed_by: staffId,
    action: 'STATUS_CHANGED',
    description: `Cập nhật trạng thái: Đơn [${order.order_status}], Thanh toán [${order.payment_status}].`,
  });
  return order;
};

const confirmDeposit = async (orderId, staffId = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }
  if (order.order_status !== 'PENDING_PAYMENT') {
    const err = new Error('Chỉ có thể xác nhận cọc cho đơn đang chờ thanh toán (PENDING_PAYMENT).');
    err.statusCode = 400;
    throw err;
  }

  const deposit = order.deposit_amount || Math.ceil(order.total_amount * 0.3);
  order.payment_type = 'DEPOSIT_30';
  order.deposit_amount = deposit;
  order.paid_amount = deposit;
  order.remaining_amount = Math.max(0, order.total_amount - deposit);
  order.payment_status = 'DEPOSIT_PAID';
  order.order_status = 'DEPOSIT_CONFIRMED';
  await order.save();

  await OrderLog.create({
    order_id: order._id,
    performed_by: staffId,
    action: 'DEPOSIT_PAID',
    description: `Xác nhận đặt cọc 30% thành công: ${deposit.toLocaleString('vi-VN')} đ. Còn nợ: ${order.remaining_amount.toLocaleString('vi-VN')} đ.`,
    metadata: { deposit_amount: deposit, remaining_amount: order.remaining_amount },
  });
  return order;
};

const companyCancelOrder = async (orderId, staffId = null, reason = 'Công ty thông báo hủy tour') => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }
  if (['CANCELLED', 'COMPLETED'].includes(order.order_status)) {
    const err = new Error('Đơn hàng không thể hủy do đã hoàn thành hoặc đã bị hủy trước đó.');
    err.statusCode = 400;
    throw err;
  }

  const paidAmount = order.paid_amount || 0;
  order.order_status = 'CANCELLED';
  order.cancel_type = 'COMPANY';
  order.cancel_reason = reason;
  order.cancel_fee_percent = 0;
  order.cancel_fee_amount = 0;
  await order.save();
  await releaseSlotsForOrder(order);
  await couponService.releaseCouponReservation(order._id);

  let refund = null;
  if (paidAmount > 0) {
    refund = await refundService.createRefund(
      order._id, order.user_id, paidAmount, order.payment_method,
      `Công ty hủy tour: hoàn 100% số tiền đã đóng (${paidAmount.toLocaleString('vi-VN')} đ)`
    );
  }

  await OrderLog.create({
    order_id: order._id,
    performed_by: staffId,
    action: 'COMPANY_CANCELLED',
    description: `Công ty hủy tour: ${reason}. Số tiền hoàn: ${paidAmount.toLocaleString('vi-VN')} đ.`,
    metadata: { refund_amount: paidAmount },
  });
  return { order, refund };
};

const resolveOverdueOrder = async (orderId, staffId, payload) => {
  const { action, new_deadline, cancel_reason } = payload;
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (action === 'EXTEND') {
    if (!new_deadline) {
      const err = new Error('Vui lòng chọn hạn thanh toán mới.');
      err.statusCode = 400;
      throw err;
    }
    const targetStatus = order.payment_status === 'DEPOSIT_PAID' ? 'DEPOSIT_CONFIRMED' : 'PENDING_PAYMENT';
    order.order_status = targetStatus;
    order.payment_deadline = new Date(new_deadline);
    await order.save();

    await OrderLog.create({
      order_id: order._id,
      performed_by: staffId,
      action: 'STATUS_CHANGED',
      description: `Gia hạn thanh toán đến ${new Date(new_deadline).toLocaleDateString('vi-VN')}, chuyển lại trạng thái [${targetStatus}].`,
      metadata: { new_deadline },
    });
    return order;
  }

  if (action === 'CANCEL') {
    const earliestDate = order.items?.reduce((earliest, it) => {
      if (!it.departure_date) return earliest;
      const d = new Date(it.departure_date);
      return !earliest || d < earliest ? d : earliest;
    }, null);

    const feePercent = earliestDate ? getCancelFeePercent(earliestDate) : 100;
    const { cancelFeeAmount, refundAmount } = calculateRefundAmount(order.paid_amount, order.total_amount, feePercent);

    order.order_status = 'CANCELLED';
    order.cancel_type = 'STAFF';
    order.cancel_reason = cancel_reason || 'Nhân viên hủy đơn do quá hạn thanh toán';
    order.cancel_fee_percent = feePercent;
    order.cancel_fee_amount = cancelFeeAmount;
    await order.save();
    await releaseSlotsForOrder(order);
    await couponService.releaseCouponReservation(order._id);

    let refund = null;
    if (refundAmount > 0) {
      refund = await refundService.createRefund(
        order._id, order.user_id, refundAmount, order.payment_method,
        `Nhân viên hủy đơn quá hạn: hoàn ${refundAmount.toLocaleString('vi-VN')} đ (phí ${feePercent}%)`
      );
    }

    await OrderLog.create({
      order_id: order._id,
      performed_by: staffId,
      action: 'CANCEL_APPROVED',
      description: `Nhân viên hủy đơn quá hạn. Phí hủy ${feePercent}% (${cancelFeeAmount.toLocaleString('vi-VN')} đ), Hoàn ${refundAmount.toLocaleString('vi-VN')} đ.`,
      metadata: { feePercent, cancelFeeAmount, refundAmount },
    });
    return { order, refund };
  }

  if (action === 'CONFIRM_PAID') {
    order.payment_status = 'PAID';
    order.order_status = 'CONFIRMED';
    order.paid_amount = order.total_amount;
    order.remaining_amount = 0;
    await order.save();
    await confirmSlotsForOrder(order);
    await couponService.confirmCouponUsed(order._id);
    await OrderLog.create({
      order_id: order._id,
      performed_by: staffId,
      action: 'FULL_PAID',
      description: 'Nhân viên xác nhận đã nhận đủ 100% tiền đơn quá hạn, chuyển sang Đã xác nhận.',
    });
    return order;
  }

  const err = new Error('Hành động xử lý không hợp lệ (EXTEND, CANCEL hoặc CONFIRM_PAID).');
  err.statusCode = 400;
  throw err;
};

const addOrderNote = async (orderId, staffId, content) => {
  if (!content || !content.trim()) {
    const err = new Error('Nội dung ghi chú không được để trống.');
    err.statusCode = 400;
    throw err;
  }
  return OrderLog.create({
    order_id: orderId,
    performed_by: staffId,
    action: 'STAFF_NOTE',
    description: content.trim(),
  });
};

const getOrderLogs = async (orderId) => {
  return OrderLog.find({ order_id: orderId })
    .populate('performed_by', 'full_name email')
    .sort({ created_at: -1 })
    .lean();
};

module.exports = {
  getAllOrdersAdmin,
  updateOrderStatus,
  confirmDeposit,
  companyCancelOrder,
  resolveOverdueOrder,
  addOrderNote,
  getOrderLogs,
};
