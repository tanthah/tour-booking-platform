const Payment = require('./payment.model');
const Order = require('../order/order.model');
const OrderLog = require('../order/orderLog.model');
const {
  createZaloPayTransaction,
  queryZaloPayTransaction,
  getConfig,
} = require('./zalopay.service');
const { verifyCallbackMac } = require('./zalopay.signature');
const { confirmSlotsForOrder } = require('../order/order.helper');
const { processZaloPayRefund, expirePendingPayments } = require('./paymentRefund.service');

/**
 * Tính số tiền cần thanh toán theo loại (cọc 30%, phần còn lại, hoặc toàn bộ)
 */
function resolvePaymentAmount(order, paymentType) {
  if (['CANCELLED', 'COMPLETED'].includes(order.order_status)) {
    const err = new Error('Đơn hàng đã hoàn thành hoặc đã bị hủy, không thể thanh toán.');
    err.statusCode = 400;
    throw err;
  }

  if (paymentType === 'deposit') {
    if (order.paid_amount > 0 || ['DEPOSIT_PAID', 'PAID'].includes(order.payment_status)) {
      const err = new Error('Đơn hàng đã thanh toán tiền cọc trước đó.');
      err.statusCode = 400;
      throw err;
    }
    return order.deposit_amount || Math.ceil(order.total_amount * 0.3);
  }

  if (paymentType === 'remaining') {
    if (order.payment_status === 'PAID' || order.remaining_amount <= 0) {
      const err = new Error('Đơn hàng đã thanh toán đủ 100%, không còn số dư.');
      err.statusCode = 400;
      throw err;
    }
    return order.remaining_amount || (order.total_amount - order.paid_amount);
  }

  if (order.payment_status === 'PAID') {
    const err = new Error('Đơn hàng đã thanh toán hoàn tất.');
    err.statusCode = 400;
    throw err;
  }
  return order.total_amount - (order.paid_amount || 0);
}

/**
 * Tạo giao dịch ZaloPay
 */
async function createPayment(userId, { orderId, paymentType = 'deposit' }) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (order.user_id.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền thanh toán cho đơn hàng này.');
    err.statusCode = 403;
    throw err;
  }

  const amount = resolvePaymentAmount(order, paymentType);
  if (amount <= 0) {
    const err = new Error('Số tiền thanh toán không hợp lệ.');
    err.statusCode = 400;
    throw err;
  }

  // Tái sử dụng giao dịch pending còn hạn (dưới 15 phút)
  const existingPayment = await Payment.findOne({
    order_id: order._id,
    payment_type: paymentType,
    status: 'pending',
    expires_at: { $gt: new Date() },
  });

  if (existingPayment?.order_url) {
    return {
      payment: existingPayment,
      order_url: existingPayment.order_url,
      zp_trans_token: existingPayment.zp_trans_token,
      expires_at: existingPayment.expires_at,
    };
  }

  const zpResult = await createZaloPayTransaction({
    orderId: order._id,
    orderCode: order.order_code,
    customerId: userId,
    amount,
    paymentType,
  });

  if (zpResult.return_code !== 1) {
    const err = new Error(zpResult.return_message || 'Không thể tạo giao dịch qua ZaloPay.');
    err.statusCode = 400;
    throw err;
  }

  const expires_at = new Date(Date.now() + 15 * 60 * 1000);

  const payment = await Payment.create({
    order_id: order._id,
    customer_id: userId,
    provider: 'zalopay',
    payment_type: paymentType,
    amount,
    status: 'pending',
    app_trans_id: zpResult.app_trans_id,
    order_url: zpResult.order_url,
    zp_trans_token: zpResult.zp_trans_token,
    expires_at,
    raw_response: zpResult,
  });

  order.payment_method = 'ZALOPAY';
  order.payment_expires_at = expires_at;
  await order.save();

  await OrderLog.create({
    order_id: order._id,
    performed_by: userId,
    action: 'PAYMENT_QR_CREATED',
    description: `Tạo giao dịch ZaloPay (${paymentType === 'deposit' ? 'Đặt cọc 30%' : 'Thanh toán'}) số tiền ${amount.toLocaleString('vi-VN')} đ. Mã GD: ${zpResult.app_trans_id}`,
    metadata: { app_trans_id: zpResult.app_trans_id, amount, paymentType },
  });

  return {
    payment,
    order_url: zpResult.order_url,
    zp_trans_token: zpResult.zp_trans_token,
    expires_at,
  };
}

/**
 * Cập nhật Order sau khi ZaloPay báo thanh toán thành công
 */
async function updateOrderOnPaymentSuccess(payment, zp_trans_id, dataJson) {
  payment.status = 'success';
  payment.zp_trans_id = zp_trans_id ? String(zp_trans_id) : '';
  payment.paid_at = new Date();
  payment.raw_response = dataJson;
  await payment.save();

  const order = await Order.findById(payment.order_id);
  if (!order) return;

  order.paid_amount = (order.paid_amount || 0) + payment.amount;
  order.remaining_amount = Math.max(0, order.total_amount - order.paid_amount);

  if (payment.payment_type === 'deposit') {
    order.order_status = 'DEPOSIT_CONFIRMED';
    order.payment_status = 'DEPOSIT_PAID';
  } else if (order.remaining_amount === 0) {
    order.order_status = 'CONFIRMED';
    order.payment_status = 'PAID';
  }

  try {
    await confirmSlotsForOrder(order);
  } catch {
    // Đã giữ chỗ trước đó
  }
  await order.save();

  await OrderLog.create({
    order_id: order._id,
    performed_by: payment.customer_id,
    action: payment.payment_type === 'deposit' ? 'DEPOSIT_PAID' : 'FULL_PAID',
    description: `ZaloPay xác nhận thanh toán thành công: ${payment.amount.toLocaleString('vi-VN')} đ. Mã GD: ${zp_trans_id}`,
    metadata: { app_trans_id: payment.app_trans_id, zp_trans_id, amount: payment.amount },
  });
}

/**
 * Xử lý callback IPN ngầm từ ZaloPay Server
 */
async function handleZaloPayCallback({ data: dataStr, mac: reqMac }) {
  const config = getConfig();
  if (!verifyCallbackMac(dataStr, reqMac, config.key2)) {
    return { return_code: -1, return_message: 'mac not equal' };
  }

  let dataJson;
  try {
    dataJson = JSON.parse(dataStr);
  } catch {
    return { return_code: 0, return_message: 'invalid json data' };
  }

  const { app_trans_id, zp_trans_id } = dataJson;
  const payment = await Payment.findOne({ app_trans_id });
  if (!payment) {
    return { return_code: 0, return_message: 'payment not found' };
  }

  // Idempotency: nếu đã xử lý thành công rồi thì bỏ qua không cộng dồn
  if (payment.status === 'success') {
    return { return_code: 1, return_message: 'success' };
  }

  await updateOrderOnPaymentSuccess(payment, zp_trans_id, dataJson);
  return { return_code: 1, return_message: 'success' };
}

/**
 * Lấy trạng thái thanh toán và kiểm tra hết hạn
 */
async function getPaymentStatus(paymentId, userId, userRoles = []) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const err = new Error('Giao dịch thanh toán không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = payment.customer_id.toString() === userId.toString();
  const isStaffOrAdmin = userRoles.some((r) => ['ADMIN', 'STAFF'].includes(r));
  if (!isOwner && !isStaffOrAdmin) {
    const err = new Error('Bạn không có quyền truy cập thông tin giao dịch này.');
    err.statusCode = 403;
    throw err;
  }

  if (payment.status === 'pending' && new Date() > payment.expires_at) {
    payment.status = 'expired';
    await payment.save();
  }

  if (payment.status === 'pending') {
    try {
      const queryRes = await queryZaloPayTransaction(payment.app_trans_id);
      if (queryRes.return_code === 1) {
        await updateOrderOnPaymentSuccess(payment, queryRes.zp_trans_id, queryRes);
      }
    } catch {
      // Tiếp tục trả trạng thái hiện tại nếu query lỗi
    }
  }

  const remainingSeconds = Math.max(0, Math.floor((payment.expires_at.getTime() - Date.now()) / 1000));

  return {
    paymentId: payment._id,
    orderId: payment.order_id,
    status: payment.status,
    amount: payment.amount,
    payment_type: payment.payment_type,
    order_url: payment.order_url,
    expires_at: payment.expires_at,
    remaining_seconds: remainingSeconds,
    paid_at: payment.paid_at,
  };
}

/**
 * Lấy danh sách lịch sử thanh toán của một đơn hàng
 */
async function getPaymentsByOrder(orderId, userId, userRoles = []) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = order.user_id.toString() === userId.toString();
  const isStaffOrAdmin = userRoles.some((r) => ['ADMIN', 'STAFF'].includes(r));
  if (!isOwner && !isStaffOrAdmin) {
    const err = new Error('Bạn không có quyền truy cập thanh toán của đơn này.');
    err.statusCode = 403;
    throw err;
  }

  return Payment.find({ order_id: orderId }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  createPayment,
  handleZaloPayCallback,
  getPaymentStatus,
  getPaymentsByOrder,
  processZaloPayRefund,
  expirePendingPayments,
};
