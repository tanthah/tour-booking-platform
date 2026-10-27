const mongoose = require('mongoose');
const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const couponService = require('../coupon/coupon.service');
const {
  generateOrderCode,
  buildOrderItems,
  reserveSlotsForOrderItems,
  mapBookingCustomers,
  confirmSlotsForOrder,
  releaseSlotsForOrder,
  expirePendingOrders,
} = require('./order.helper');

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

const supportsTransaction = () => {
  const desc = mongoose.connection?.client?.topology?.description;
  return Boolean(desc?.setName || ['ReplicaSetWithPrimary', 'Sharded'].includes(desc?.type));
};

/**
 * Checkout: Tạo đơn hàng từ giỏ hàng trong transaction
 * Backend tự tính toán giá, validate coupon, giữ chỗ tour và coupon nguyên tử
 */
const createOrderFromCart = async (userId, payload) => {
  const { customer_info, selected_items, booking_customers, payment_method, departures = {} } = payload;

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
      payment_method: payment_method || 'CASH',
      payment_status: 'PENDING',
      order_status: 'PENDING_PAYMENT',
      payment_expires_at: new Date(Date.now() + PAYMENT_TIMEOUT_MS),
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
    return order;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    } else {
      if (slotsReserved) {
        await releaseSlotsForOrder({ items: orderItems, order_status: 'PENDING_PAYMENT' });
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

const updateOrderStatus = async (orderId, statusData) => {
  const { order_status, payment_status, cancel_reason } = statusData;

  // 1. Xác nhận thanh toán PAID
  if (payment_status === 'PAID') {
    const paidOrder = await Order.findOneAndUpdate(
      { _id: orderId, order_status: 'PENDING_PAYMENT', payment_status: { $ne: 'PAID' } },
      { $set: { payment_status: 'PAID', order_status: 'CONFIRMED' } },
      { new: true }
    );
    if (paidOrder) {
      await confirmSlotsForOrder(paidOrder);
      await couponService.confirmCouponUsed(paidOrder._id);
      return paidOrder;
    }
  }

  // 2. Admin hủy đơn CANCELLED
  if (order_status === 'CANCELLED') {
    const cancelledOrder = await Order.findOneAndUpdate(
      { _id: orderId, order_status: { $ne: 'CANCELLED' } },
      { $set: { order_status: 'CANCELLED', cancel_reason: cancel_reason || 'Admin hủy đơn' } },
      { new: true }
    );
    if (cancelledOrder) {
      await releaseSlotsForOrder(cancelledOrder);
      await couponService.releaseCouponReservation(cancelledOrder._id);
      return cancelledOrder;
    }
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Đơn hàng không tồn tại.');
    err.statusCode = 404;
    throw err;
  }

  if (payment_status && order.payment_status !== payment_status) {
    order.payment_status = payment_status;
  }
  if (order_status && order.order_status !== order_status) {
    order.order_status = order_status;
    if (cancel_reason) order.cancel_reason = cancel_reason;
  }

  await order.save();
  return order;
};

const cancelOrder = async (userId, orderId, cancelReason) => {
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, user_id: userId, order_status: 'PENDING_PAYMENT' },
    { $set: { order_status: 'CANCELLED', cancel_reason: cancelReason || 'Khách hàng tự hủy' } },
    { new: true }
  );

  if (!updatedOrder) {
    const existing = await Order.findById(orderId);
    if (!existing) {
      const err = new Error('Đơn hàng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }
    if (existing.user_id.toString() !== userId.toString()) {
      const err = new Error('Bạn không có quyền hủy đơn hàng này.');
      err.statusCode = 403;
      throw err;
    }
    const err = new Error('Chỉ có thể hủy đơn đang chờ thanh toán.');
    err.statusCode = 400;
    throw err;
  }

  await releaseSlotsForOrder(updatedOrder);
  await couponService.releaseCouponReservation(updatedOrder._id);
  return updatedOrder;
};

module.exports = {
  createOrderFromCart,
  getMyOrders,
  getOrderDetail,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelOrder,
  expirePendingOrders,
};
