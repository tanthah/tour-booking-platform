const Tour = require('../tour/tour.model');
const TourDeparture = require('../tour/tourDeparture.model');
const Order = require('./order.model');
const OrderLog = require('./orderLog.model');
const couponService = require('../coupon/coupon.service');

/**
 * Sinh mã đơn hàng duy nhất: ORD-YYYYMMDD-XXXX (4 ký tự hex)
 */
const generateOrderCode = () => {
  const now = new Date();
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `ORD-${dateStr}-${rand}`;
};

/**
 * Xây dựng danh sách order items kèm snapshot giá & thông tin từ DB
 * Xử lý chính xác giá 0đ (miễn phí em bé/trẻ em/khuyến mãi) bằng toán tử ??
 */
const buildOrderItems = async (cartItems, departuresMap = {}) => {
  const tourIds = cartItems.map((item) => item.tour_id);
  const tours = await Tour.find({ _id: { $in: tourIds }, deleted_at: null });
  const tourMap = {};
  tours.forEach((t) => { tourMap[t._id.toString()] = t; });

  const departureIds = cartItems
    .map((item) => (item._id && departuresMap[item._id.toString()]) || item.departure_id)
    .filter(Boolean);
  const departures = departureIds.length > 0
    ? await TourDeparture.find({ _id: { $in: departureIds }, deleted_at: null })
    : [];
  const depMap = {};
  departures.forEach((d) => { depMap[d._id.toString()] = d; });

  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cartItems) {
    const tour = tourMap[cartItem.tour_id.toString()];
    if (!tour) {
      const err = new Error(`Tour ${cartItem.tour_id} không tồn tại hoặc đã bị xóa.`);
      err.statusCode = 400;
      throw err;
    }

    // Giá 0đ là hợp lệ: ưu tiên sale_price nếu có thiết lập, fallback original_price ?? 0
    const priceAdult = (tour.sale_price !== null && tour.sale_price !== undefined)
      ? tour.sale_price
      : (tour.original_price ?? 0);

    const priceChild = (tour.price_child !== null && tour.price_child !== undefined)
      ? tour.price_child
      : Math.round(priceAdult * 0.7);

    const priceBaby = (tour.price_baby !== null && tour.price_baby !== undefined)
      ? tour.price_baby
      : Math.round(priceAdult * 0.3);

    const qtyAdult = cartItem.quantity_adult ?? cartItem.quantity ?? 1;
    const qtyChild = cartItem.quantity_child ?? 0;
    const qtyBaby = cartItem.quantity_baby ?? 0;
    const totalQty = qtyAdult + qtyChild + qtyBaby;

    const itemSubtotal =
      (priceAdult * qtyAdult) + (priceChild * qtyChild) + (priceBaby * qtyBaby);
    subtotal += itemSubtotal;

    const cartItemId = cartItem._id ? cartItem._id.toString() : '';
    const departureId = (cartItemId && departuresMap[cartItemId]) || cartItem.departure_id || null;
    const dep = departureId ? depMap[departureId.toString()] : null;

    orderItems.push({
      tour_id: tour._id,
      departure_id: departureId,
      tour_name: tour.title,
      tour_code: tour.code,
      main_image: tour.main_image,
      departure_date: dep?.departure_date || tour.departure_date || null,
      departure_location: dep?.departure_location || tour.departure_location || '',
      duration: tour.duration || '',
      price_adult: priceAdult,
      price_child: priceChild,
      price_baby: priceBaby,
      quantity_adult: qtyAdult,
      quantity_child: qtyChild,
      quantity_baby: qtyBaby,
      quantity: totalQty,
      subtotal: itemSubtotal,
    });
  }

  return { orderItems, subtotal };
};

/**
 * Giữ chỗ tạm trên TourDeparture trong session transaction
 * Đảm bảo tính nhất quán của trạng thái OPEN/FULL và số chỗ còn lại
 */
const reserveSlotsForOrderItems = async (orderItems, session) => {
  for (const item of orderItems) {
    if (!item.departure_id) continue;
    const departure = await TourDeparture.findOneAndUpdate(
      {
        _id: item.departure_id,
        status: { $in: ['OPEN', 'FULL'] },
        deleted_at: null,
        $expr: {
          $gte: [
            { $subtract: ['$total_slots', { $add: ['$booked_slots', '$reserved_slots'] }] },
            item.quantity,
          ],
        },
      },
      { $inc: { reserved_slots: item.quantity } },
      { new: true, ...(session ? { session } : {}) }
    );

    if (!departure) {
      const err = new Error(`Đợt khởi hành của tour "${item.tour_name}" không còn đủ chỗ.`);
      err.statusCode = 400;
      throw err;
    }

    const available = departure.total_slots - departure.booked_slots - departure.reserved_slots;
    if (available === 0 && departure.status !== 'FULL') {
      await TourDeparture.updateOne(
        { _id: departure._id },
        { $set: { status: 'FULL' } },
        session ? { session } : {}
      );
    } else if (available > 0 && departure.status === 'FULL') {
      await TourDeparture.updateOne(
        { _id: departure._id },
        { $set: { status: 'OPEN' } },
        session ? { session } : {}
      );
    }
  }
};

/**
 * Gắn danh sách booking_customers vào order_item_id tương ứng
 * Kiểm tra chặt chẽ số lượng khách gửi lên phải khớp chính xác với số vé đặt
 */
const mapBookingCustomers = (bookingCustomers, cartItems, order) => {
  const itemIdMap = {};
  cartItems.forEach((ci, idx) => {
    itemIdMap[ci._id.toString()] = order.items[idx]._id;
  });

  const countByCartItemId = {};
  for (const cust of bookingCustomers) {
    const key = cust.cart_item_id;
    countByCartItemId[key] = (countByCartItemId[key] || 0) + 1;
  }

  for (let i = 0; i < cartItems.length; i++) {
    const ci = cartItems[i];
    const orderItem = order.items[i];
    const cartItemId = ci._id.toString();
    const actualCount = countByCartItemId[cartItemId] || 0;
    const expectedCount = orderItem.quantity;

    if (actualCount !== expectedCount) {
      const err = new Error(
        `Số lượng thông tin khách (${actualCount}) không khớp với tổng số chỗ đã đặt (${expectedCount}) cho tour "${orderItem.tour_name}".`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return bookingCustomers.map((cust) => {
    const orderItemId = itemIdMap[cust.cart_item_id];
    if (!orderItemId) {
      const err = new Error(`cart_item_id "${cust.cart_item_id}" không hợp lệ.`);
      err.statusCode = 400;
      throw err;
    }
    return {
      order_item_id: orderItemId,
      full_name: cust.full_name,
      phone: cust.phone,
      email: cust.email || null,
      date_of_birth: cust.date_of_birth || null,
      gender: cust.gender || null,
      id_number: cust.id_number || null,
      note: cust.note || '',
    };
  });
};

/**
 * Chuyển reserved → booked cho toàn bộ items trong đơn khi thanh toán thành công
 */
const confirmSlotsForOrder = async (order) => {
  for (const item of order.items) {
    if (!item.departure_id) continue;
    await TourDeparture.findOneAndUpdate(
      { _id: item.departure_id, reserved_slots: { $gte: item.quantity } },
      { $inc: { reserved_slots: -item.quantity, booked_slots: item.quantity } }
    );
  }
};

/**
 * Giải phóng chỗ khi hủy đơn, đồng bộ mở lại trạng thái OPEN nếu có chỗ trống
 */
const releaseSlotsForOrder = async (order) => {
  for (const item of order.items) {
    if (!item.departure_id) continue;
    // Nếu đơn chưa thanh toán thì giải phóng reserved_slots; nếu đã thanh toán thì giải phóng booked_slots
    const isReserved = order.payment_status !== 'PAID';
    const filter = isReserved
      ? { _id: item.departure_id, reserved_slots: { $gte: item.quantity } }
      : { _id: item.departure_id, booked_slots: { $gte: item.quantity } };
    const update = isReserved
      ? { $inc: { reserved_slots: -item.quantity } }
      : { $inc: { booked_slots: -item.quantity } };

    const dep = await TourDeparture.findOneAndUpdate(filter, update, { new: true });
    if (dep) {
      const avail = dep.total_slots - dep.booked_slots - dep.reserved_slots;
      if (avail > 0 && dep.status === 'FULL') {
        await TourDeparture.updateOne(
          { _id: dep._id, status: 'FULL' },
          { $set: { status: 'OPEN' } }
        );
      }
    }
  }
};

/**
 * Chuyển đơn quá hạn thanh toán sang "Chờ nhân viên xử lý" (AWAITING_STAFF)
 * Không tự động hủy, không tự động giải phóng slot (giữ chỗ chờ nhân viên quyết định)
 */
const flagOverdueOrders = async () => {
  const now = new Date();
  const overdueOrders = await Order.find({
    order_status: { $in: ['PENDING_PAYMENT', 'DEPOSIT_CONFIRMED'] },
    $or: [
      { payment_deadline: { $ne: null, $lte: now } },
      { payment_expires_at: { $ne: null, $lte: now }, payment_deadline: null },
    ],
  }).select('_id order_status payment_deadline payment_expires_at');

  let flaggedCount = 0;
  for (const ord of overdueOrders) {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: ord._id, order_status: { $in: ['PENDING_PAYMENT', 'DEPOSIT_CONFIRMED'] } },
      { $set: { order_status: 'AWAITING_STAFF' } },
      { new: true }
    );

    if (updatedOrder) {
      await OrderLog.create({
        order_id: updatedOrder._id,
        action: 'OVERDUE_FLAGGED',
        description: 'Đơn hàng quá hạn thanh toán, chuyển sang Chờ nhân viên xử lý.',
        metadata: { prev_status: ord.order_status, deadline: ord.payment_deadline || ord.payment_expires_at },
      });
      flaggedCount++;
    }
  }
  return { flaggedCount };
};

const expirePendingOrders = flagOverdueOrders;

module.exports = {
  generateOrderCode,
  buildOrderItems,
  reserveSlotsForOrderItems,
  mapBookingCustomers,
  confirmSlotsForOrder,
  releaseSlotsForOrder,
  flagOverdueOrders,
  expirePendingOrders,
};
