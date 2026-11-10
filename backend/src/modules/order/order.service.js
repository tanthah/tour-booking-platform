const mongoose = require('mongoose');
const Order = require('./order.model');
const OrderLog = require('./orderLog.model');
const Cart = require('../cart/cart.model');
const couponService = require('../coupon/coupon.service');
const refundService = require('./refund.service');
const orderAdminService = require('./orderAdmin.service');
const { getBookingPolicy, getCancelFeePercent, calculateRefundAmount } = require('./booking.policy');
const {
  generateOrderCode, buildOrderItems, reserveSlotsForOrderItems,
  mapBookingCustomers, releaseSlotsForOrder, flagOverdueOrders, expirePendingOrders,
} = require('./order.helper');

const supportsTransaction = () => {
  const desc = mongoose.connection?.client?.topology?.description;
  return Boolean(desc?.setName || ['ReplicaSetWithPrimary', 'Sharded'].includes(desc?.type));
};

const createOrderFromCart = async (userId, payload) => {
  const { customer_info, selected_items, booking_customers, payment_method, departures = {}, payment_type = 'FULL' } = payload;

  const cart = await Cart.findOne({ user_id: userId, status: 'ACTIVE' });
  if (!cart || !cart.items || cart.items.length === 0) {
    const err = new Error('Giỏ hàng trống hoặc không tồn tại.');
    err.statusCode = 400;
    throw err;
  }

  const cartItems = cart.items.filter((item) => selected_items.includes(item._id.toString()));
  if (cartItems.length === 0) {
    const err = new Error('Không tìm thấy tour hợp lệ được chọn trong giỏ hàng.');
    err.statusCode = 400;
    throw err;
  }

  const { orderItems, subtotal } = await buildOrderItems(cartItems, departures);

  let couponData = null;
  const couponCode = payload.coupon_code ? payload.coupon_code.trim().toUpperCase() : null;
  if (couponCode) {
    const result = await couponService.validateCoupon(userId, couponCode, subtotal, { orderItems });
    couponData = { coupon: result.coupon, discountAmount: result.discountAmount };
  }

  const discountAmount = couponData ? couponData.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const isDeposit = payment_type === 'DEPOSIT_30' || payment_type === 'DEPOSIT';
  let earliestDeadline = null;

  for (const item of orderItems) {
    if (!item.departure_date) continue;
    const policy = getBookingPolicy(item.departure_date);
    if (!policy.canBook) {
      const err = new Error(`Tour "${item.tour_name}": ${policy.reason}`);
      err.statusCode = 400;
      throw err;
    }
    if (isDeposit && !policy.allowDeposit) {
      const err = new Error(`Tour "${item.tour_name}": ${policy.reason}`);
      err.statusCode = 400;
      throw err;
    }
    if (policy.paymentDeadline && (!earliestDeadline || policy.paymentDeadline < earliestDeadline)) {
      earliestDeadline = policy.paymentDeadline;
    }
  }

  const depositAmount = isDeposit ? Math.ceil(totalAmount * 0.3) : null;
  const normalizedPaymentType = isDeposit ? 'DEPOSIT_30' : 'FULL';

  let orderCode = generateOrderCode();
  const existing = await Order.findOne({ order_code: orderCode });
  if (existing) orderCode = generateOrderCode();

  let session = null;
  if (supportsTransaction()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  let slotsReserved = false;
  let couponReserved = false;
  try {
    await reserveSlotsForOrderItems(orderItems, session);
    slotsReserved = true;

    const orderData = {
      order_code: orderCode,
      user_id: userId,
      customer_info: {
        full_name: customer_info.full_name,
        phone: customer_info.phone,
        email: customer_info.email || '',
        note: customer_info.note || '',
      },
      items: orderItems,
      booking_customers: [],
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      coupon_id: couponData ? couponData.coupon._id : null,
      coupon_code: couponData ? couponData.coupon.code : null,
      payment_method: payment_method || 'COUNTER',
      payment_type: normalizedPaymentType,
      deposit_amount: depositAmount,
      paid_amount: 0,
      remaining_amount: totalAmount,
      payment_deadline: isDeposit ? earliestDeadline : null,
      payment_status: 'PENDING',
      order_status: 'PENDING_PAYMENT',
      payment_expires_at: null,
    };

    const createdList = await Order.create(
      session ? [orderData] : [orderData],
      session ? { session } : {}
    );
    const order = Array.isArray(createdList) ? createdList[0] : createdList;

    if (couponData) {
      await couponService.reserveCoupon(
        couponData.coupon._id, userId, order._id, discountAmount, session
      );
      couponReserved = true;
    }

    order.booking_customers = mapBookingCustomers(booking_customers, cartItems, order);
    await order.save(session ? { session } : {});

    cart.items = cart.items.filter((item) => !selected_items.includes(item._id.toString()));
    await cart.save(session ? { session } : {});

    if (session) await session.commitTransaction();

    await OrderLog.create({
      order_id: order._id,
      performed_by: userId,
      action: 'CREATED',
      description: `Đơn hàng tạo thành công (${normalizedPaymentType === 'DEPOSIT_30' ? 'Cọc 30%' : 'Thanh toán 100%'}). Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} đ.`,
      metadata: { total_amount: totalAmount, deposit_amount: depositAmount },
    });

    return order;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    } else {
      if (slotsReserved) {
        await releaseSlotsForOrder({ items: orderItems, payment_status: 'PENDING' });
      }
      if (couponReserved && couponData) {
        await couponService.releaseCouponReservation(null);
      }
    }
    throw error;
  } finally {
    if (session) session.endSession();
  }
};

const getMyOrders = async (userId, queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { user_id: userId };
  if (queryParams.order_status) filter.order_status = queryParams.order_status;
  if (queryParams.payment_status) filter.payment_status = queryParams.payment_status;

  const [orders, total] = await Promise.all([
    Order.find(filter).select('-booking_customers.id_number').sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getOrderDetail = async (userId, orderId, userRoles) => {
  const order = await Order.findById(orderId).lean();
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = order.user_id.toString() === userId.toString();
  const isStaffOrAdmin = userRoles.some((r) => ['ADMIN', 'STAFF'].includes(r));
  if (!isOwner && !isStaffOrAdmin) {
    const err = new Error('Bạn không có quyền xem đơn hàng này.');
    err.statusCode = 403;
    throw err;
  }

  if (!isStaffOrAdmin && order.booking_customers) {
    order.booking_customers = order.booking_customers.map(({ id_number, ...rest }) => rest);
  }
  return order;
};

const cancelOrder = async (userId, orderId, cancelReason) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (order.user_id.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền hủy đơn hàng này.');
    err.statusCode = 403;
    throw err;
  }

  if (order.order_status === 'AWAITING_STAFF') {
    const err = new Error('Đơn hàng đang chờ nhân viên xử lý, vui lòng liên hệ bộ phận hỗ trợ.');
    err.statusCode = 400;
    throw err;
  }

  if (['CANCELLED', 'COMPLETED'].includes(order.order_status)) {
    const err = new Error('Đơn hàng đã hoàn thành hoặc đã bị hủy trước đó.');
    err.statusCode = 400;
    throw err;
  }

  const earliestDate = order.items?.reduce((earliest, it) => {
    if (!it.departure_date) return earliest;
    const d = new Date(it.departure_date);
    return !earliest || d < earliest ? d : earliest;
  }, null);

  const feePercent = earliestDate ? getCancelFeePercent(earliestDate) : 100;
  const { cancelFeeAmount, refundAmount } = calculateRefundAmount(order.paid_amount, order.total_amount, feePercent);

  order.order_status = 'CANCELLED';
  order.cancel_type = 'CUSTOMER';
  order.cancel_reason = cancelReason || 'Khách hàng tự hủy';
  order.cancel_fee_percent = feePercent;
  order.cancel_fee_amount = cancelFeeAmount;
  await order.save();

  await releaseSlotsForOrder(order);
  await couponService.releaseCouponReservation(order._id);

  let refund = null;
  if (refundAmount > 0) {
    refund = await refundService.createRefund(
      order._id,
      userId,
      refundAmount,
      order.payment_method,
      `Khách tự hủy: hoàn ${refundAmount.toLocaleString('vi-VN')} đ (phí hủy ${feePercent}%)`
    );
  }

  await OrderLog.create({
    order_id: order._id,
    performed_by: userId,
    action: 'CANCEL_REQUESTED',
    description: `Khách hủy đơn hàng. Phí hủy ${feePercent}% (${cancelFeeAmount.toLocaleString('vi-VN')} đ), Hoàn lại ${refundAmount.toLocaleString('vi-VN')} đ.`,
    metadata: { feePercent, cancelFeeAmount, refundAmount },
  });

  return { order, refundAmount, cancelFeeAmount, refund };
};

module.exports = {
  createOrderFromCart,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  flagOverdueOrders,
  expirePendingOrders,
  getAllOrdersAdmin: orderAdminService.getAllOrdersAdmin,
  updateOrderStatus: orderAdminService.updateOrderStatus,
  confirmDeposit: orderAdminService.confirmDeposit,
  companyCancelOrder: orderAdminService.companyCancelOrder,
  resolveOverdueOrder: orderAdminService.resolveOverdueOrder,
  addOrderNote: orderAdminService.addOrderNote,
  getOrderLogs: orderAdminService.getOrderLogs,
};
