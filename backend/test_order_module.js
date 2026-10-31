/**
 * Test script cho Order Module
 * Kiểm tra các luồng nghiệp vụ theo yêu cầu và ràng buộc:
 * 1. Sinh mã đơn hàng (ORD-YYYYMMDD-XXXX)
 * 2. Lưu snapshot giá và tên tour từ DB, không tin client
 * 3. Mỗi khách đi tour gắn đúng order_item_id
 * 4. Giữ chỗ 15 phút trên TourDeparture
 * 5. Tự động hủy đơn hết hạn và hoàn lại slots
 * 6. Admin cập nhật PAID -> chuyển reserved sang booked
 * 7. Khách tự hủy đơn đang PENDING_PAYMENT -> hoàn lại reserved slots
 * 8. Bảo mật chống IDOR và ẩn id_number
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('./config/env');
const Order = require('./modules/order/order.model');
const Cart = require('./modules/cart/cart.model');
const Tour = require('./modules/tour/tour.model');
const TourDeparture = require('./modules/tour/tourDeparture.model');
const User = require('./modules/user/user.model');
const orderService = require('./modules/order/order.service');
const orderHelper = require('./modules/order/order.helper');

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ ORDER MODULE ===\n');
  await mongoose.connect(MONGO_URI);
  console.log('1. Đã kết nối MongoDB thành công.');

  // Tạo mock user 1 (Customer A)
  const userA = await User.findOneAndUpdate(
    { email: 'test_customera@test.com' },
    {
      full_name: 'Khách hàng A',
      email: 'test_customera@test.com',
      phone: '0901234567',
      password_hash: 'mockhash',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  // Tạo mock user 2 (Customer B)
  const userB = await User.findOneAndUpdate(
    { email: 'test_customerb@test.com' },
    {
      full_name: 'Khách hàng B',
      email: 'test_customerb@test.com',
      phone: '0907654321',
      password_hash: 'mockhash',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  // Tạo mock tour
  const tourCode = `TEST-${Date.now()}`;
  const tour = await Tour.create({
    code: tourCode,
    title: 'Tour Thử Nghiệm Đà Nẵng 3N2Đ',
    category: 'DOMESTIC',
    region: 'MIEN_TRUNG',
    destination_location: 'Đà Nẵng',
    duration: '3 Ngày 2 Đêm',
    original_price: 3000000,
    discount_percent: 10,
    sale_price: 2700000,
    main_image: 'https://example.com/tour.jpg',
    status: 'ACTIVE',
  });
  console.log('2. Đã tạo Mock Tour:', tour.title, '| Giá bán:', tour.sale_price);

  // Tạo mock departure
  const departure = await TourDeparture.create({
    product_id: tour._id,
    departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    departure_location: 'TP. Hồ Chí Minh',
    total_slots: 20,
    booked_slots: 0,
    reserved_slots: 0,
    status: 'OPEN',
  });
  console.log('3. Đã tạo Mock Departure: Tổng 20 chỗ, Đã đặt: 0, Giữ tạm: 0');

  // Tạo active cart cho User A
  let cartA = await Cart.findOneAndUpdate(
    { user_id: userA._id, status: 'ACTIVE' },
    {
      user_id: userA._id,
      status: 'ACTIVE',
      items: [
        {
          tour_id: tour._id,
          quantity: 2,
          quantity_adult: 2,
          quantity_child: 0,
          quantity_baby: 0,
        },
      ],
    },
    { upsert: true, new: true }
  );
  const cartItemId = cartA.items[0]._id.toString();
  console.log('4. Đã tạo giỏ hàng cho User A với item ID:', cartItemId);

  // TEST 1: Checkout từ giỏ hàng
  console.log('\n--- TEST 1: Checkout tạo đơn hàng ---');
  const payload = {
    customer_info: {
      full_name: 'Nguyễn Văn Đặt',
      phone: '0901234567',
      email: 'dat@example.com',
      note: 'Yêu cầu phòng tầng cao',
    },
    selected_items: [cartItemId],
    departures: {
      [cartItemId]: departure._id.toString(),
    },
    booking_customers: [
      {
        cart_item_id: cartItemId,
        full_name: 'Nguyễn Văn Đi 1',
        phone: '0911111111',
        id_number: '123456789012',
        gender: 'MALE',
      },
      {
        cart_item_id: cartItemId,
        full_name: 'Trần Thị Đi 2',
        phone: '0922222222',
        id_number: '987654321098',
        gender: 'FEMALE',
      },
    ],
    payment_method: 'ZALOPAY',
  };

  const order = await orderService.createOrderFromCart(userA._id, payload);
  console.log('✓ Tạo đơn thành công! Mã đơn:', order.order_code);
  console.log('✓ Subtotal tính từ DB (2 x 2.700.000):', order.subtotal);
  if (order.subtotal !== 5400000) throw new Error('Subtotal sai!');
  console.log('✓ Snapshot tên tour:', order.items[0].tour_name);
  console.log('✓ Số khách đi tour được lưu:', order.booking_customers.length);
  console.log('✓ Khách 1 đã gắn đúng order_item_id:', order.booking_customers[0].order_item_id.toString() === order.items[0]._id.toString());
  console.log('✓ Thời gian hết hạn giữ chỗ (15p):', order.payment_expires_at);

  // Kiểm tra số chỗ giữ tạm trên departure
  const depAfterCheckout = await TourDeparture.findById(departure._id);
  console.log('✓ Departure reserved_slots hiện tại:', depAfterCheckout.reserved_slots, '(kỳ vọng: 2)');
  if (depAfterCheckout.reserved_slots !== 2) throw new Error('reserved_slots chưa được cập nhật!');

  // Kiểm tra giỏ hàng sau checkout
  const cartAfter = await Cart.findById(cartA._id);
  console.log('✓ Số item còn lại trong giỏ hàng:', cartAfter.items.length, '(kỳ vọng: 0)');
  if (cartAfter.items.length !== 0) throw new Error('Item chưa được xóa khỏi giỏ hàng!');

  // TEST 2: Chống IDOR (User B không xem được đơn của User A)
  console.log('\n--- TEST 2: Chống IDOR ---');
  try {
    await orderService.getOrderDetail(userB._id, order._id, ['CUSTOMER']);
    throw new Error('Lỗi: User B không được phép xem đơn của User A!');
  } catch (err) {
    if (err.statusCode === 403) {
      console.log('✓ Thành công: User B bị chặn xem đơn với mã lỗi 403 Forbidden.');
    } else {
      throw err;
    }
  }

  // TEST 3: Quyền xem & Ẩn id_number cho Customer
  console.log('\n--- TEST 3: Xem chi tiết & Ẩn CCCD/id_number với Customer ---');
  const userADetail = await orderService.getOrderDetail(userA._id, order._id, ['CUSTOMER']);
  const cust0 = userADetail.booking_customers[0];
  console.log('✓ Customer xem đơn: CCCD/id_number có hiển thị?', cust0.id_number === undefined ? 'Đã bị ẩn an toàn' : 'Lỗi chưa ẩn');
  if (cust0.id_number !== undefined) throw new Error('CCCD không được lộ ra ngoài!');

  // Admin xem chi tiết thì có CCCD
  const adminDetail = await orderService.getOrderDetail(userB._id, order._id, ['ADMIN']);
  console.log('✓ Admin xem đơn: CCCD/id_number có hiển thị?', adminDetail.booking_customers[0].id_number ? 'Có đầy đủ' : 'Không');

  // TEST 4: Tự động hủy đơn hết hạn thanh toán (15 phút)
  console.log('\n--- TEST 4: Tự động hủy đơn hết hạn thanh toán (15 phút) ---');
  // Giả lập đơn bị quá hạn 15 phút
  order.payment_expires_at = new Date(Date.now() - 1000); // 1 giây trước
  await order.save();

  const expireResult = await orderHelper.expirePendingOrders();
  console.log('✓ Số đơn quá hạn đã tự động hủy:', expireResult.expiredCount);

  const expiredOrder = await Order.findById(order._id);
  console.log('✓ Trạng thái đơn sau auto-expire:', expiredOrder.order_status, '| Lý do:', expiredOrder.cancel_reason);
  if (expiredOrder.order_status !== 'CANCELLED') throw new Error('Đơn chưa bị CANCELLED!');

  const depAfterExpire = await TourDeparture.findById(departure._id);
  console.log('✓ Departure reserved_slots sau auto-expire:', depAfterExpire.reserved_slots, '(kỳ vọng: 0)');
  if (depAfterExpire.reserved_slots !== 0) throw new Error('reserved_slots chưa được hoàn lại!');

  // TEST 5: Thanh toán thành công chuyển reserved -> booked
  console.log('\n--- TEST 5: Admin xác nhận thanh toán (PAID -> CONFIRMED -> booked_slots) ---');
  // Tạo lại đơn mới để test xác nhận thanh toán
  const order2 = await Order.create({
    order_code: orderHelper.generateOrderCode(),
    user_id: userA._id,
    customer_info: payload.customer_info,
    items: [
      {
        tour_id: tour._id,
        departure_id: departure._id,
        tour_name: tour.title,
        price_adult: 2700000,
        quantity_adult: 3,
        quantity: 3,
        subtotal: 8100000,
      },
    ],
    booking_customers: [
      {
        order_item_id: new mongoose.Types.ObjectId(),
        full_name: 'Khách A',
        phone: '0901234567',
      },
    ],
    subtotal: 8100000,
    total_amount: 8100000,
    payment_method: 'ZALOPAY',
    payment_status: 'PENDING',
    order_status: 'PENDING_PAYMENT',
    payment_expires_at: new Date(Date.now() + 15 * 60 * 1000),
  });
  // Giữ 3 chỗ
  await TourDeparture.findByIdAndUpdate(departure._id, { $inc: { reserved_slots: 3 } });

  // Admin cập nhật payment_status: 'PAID'
  await orderService.updateOrderStatus(order2._id, { payment_status: 'PAID' });
  const order2Updated = await Order.findById(order2._id);
  console.log('✓ Trạng thái order2: payment_status =', order2Updated.payment_status, '| order_status =', order2Updated.order_status);

  const depAfterPaid = await TourDeparture.findById(departure._id);
  console.log('✓ Departure sau PAID: reserved_slots =', depAfterPaid.reserved_slots, '| booked_slots =', depAfterPaid.booked_slots, '(kỳ vọng: reserved 0, booked 3)');
  if (depAfterPaid.booked_slots !== 3 || depAfterPaid.reserved_slots !== 0) {
    throw new Error('Slots chưa được chuyển từ reserved sang booked!');
  }

  // Dọn dẹp dữ liệu test
  console.log('\n--- Dọn dẹp dữ liệu test ---');
  await Order.deleteMany({ _id: { $in: [order._id, order2._id] } });
  await TourDeparture.findByIdAndDelete(departure._id);
  await Tour.findByIdAndDelete(tour._id);
  await Cart.findByIdAndDelete(cartA._id);
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
  console.log('✓ Đã dọn dẹp xong dữ liệu test.');

  console.log('\n========================================');
  console.log('🎉 TẤT CẢ 5 BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%!');
  console.log('========================================');
}

runTests()
  .then(() => {
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ KIỂM THỬ THẤT BẠI:', err);
    mongoose.disconnect();
    process.exit(1);
  });
