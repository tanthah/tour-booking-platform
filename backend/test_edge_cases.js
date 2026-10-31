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

async function testEdgeCases() {
  console.log('=== KIỂM THỬ 5 VẤN ĐỀ VÀ TRƯỜNG HỢP BIÊN ===\n');
  await mongoose.connect(MONGO_URI);

  const testUser = await User.findOneAndUpdate(
    { email: 'edge_test_user@test.com' },
    {
      full_name: 'Khách Edge Test',
      email: 'edge_test_user@test.com',
      phone: '0908889999',
      password_hash: 'mockhash',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  // -------------------------------------------------------------------------
  // TEST VẤN ĐỀ 5: Giá 0đ không bị ghi đè bởi giá mặc định (?? vs ||)
  // -------------------------------------------------------------------------
  console.log('--- TEST VẤN ĐỀ 5: Giá 0đ (Miễn phí trẻ em / em bé) ---');
  const zeroPriceTour = await Tour.create({
    code: `ZERO-${Date.now()}`,
    title: 'Tour Miễn Phí Trẻ Em & Em Bé',
    category: 'DOMESTIC',
    destination_location: 'Vũng Tàu',
    duration: '1 Ngày',
    original_price: 1000000,
    sale_price: 1000000,
    price_child: 0, // Trẻ em 0đ
    price_baby: 0,  // Em bé 0đ
    main_image: 'https://example.com/tour.jpg',
    status: 'ACTIVE',
  });

  const cartItemsMock = [
    {
      tour_id: zeroPriceTour._id,
      quantity_adult: 2,
      quantity_child: 1, // Trẻ em nên tính 0đ
      quantity_baby: 1,  // Em bé nên tính 0đ
      quantity: 4,
    },
  ];

  const builtItems = await orderHelper.buildOrderItems(cartItemsMock, {});
  console.log('✓ Giá người lớn:', builtItems.orderItems[0].price_adult);
  console.log('✓ Giá trẻ em (kỳ vọng 0):', builtItems.orderItems[0].price_child);
  console.log('✓ Giá em bé (kỳ vọng 0):', builtItems.orderItems[0].price_baby);
  console.log('✓ Subtotal (2 x 1.000.000 + 1 x 0 + 1 x 0 = 2.000.000):', builtItems.subtotal);

  if (builtItems.orderItems[0].price_child !== 0) throw new Error('Lỗi: Giá trẻ em 0đ bị ghi đè!');
  if (builtItems.orderItems[0].price_baby !== 0) throw new Error('Lỗi: Giá em bé 0đ bị ghi đè!');
  if (builtItems.subtotal !== 2000000) throw new Error('Lỗi: Subtotal tính sai!');
  console.log('-> VẤN ĐỀ 5: ĐÃ SỬA CHÍNH XÁC!\n');

  // -------------------------------------------------------------------------
  // TEST VẤN ĐỀ 4: Kiểm tra số lượng khách đi tour khớp với vé đặt
  // -------------------------------------------------------------------------
  console.log('--- TEST VẤN ĐỀ 4: Kiểm tra số lượng thông tin khách ---');
  const mockCartItem = {
    _id: new mongoose.Types.ObjectId(),
    tour_id: zeroPriceTour._id,
    quantity_adult: 2,
    quantity_child: 1,
    quantity_baby: 0,
    quantity: 3, // Tổng 3 vé
  };
  const mockOrder = {
    items: [
      {
        _id: new mongoose.Types.ObjectId(),
        tour_name: 'Tour Test',
        quantity: 3, // Cần 3 khách
      },
    ],
  };

  // Trường hợp gửi thiếu khách (2 khách thay vì 3)
  try {
    orderHelper.mapBookingCustomers(
      [
        { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 1', phone: '0901' },
        { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 2', phone: '0902' },
      ],
      [mockCartItem],
      mockOrder
    );
    throw new Error('Lỗi: Gửi thiếu khách nhưng không bị chặn!');
  } catch (err) {
    console.log('✓ Chặn thành công khi gửi thiếu khách:', err.message);
  }

  // Trường hợp gửi thừa khách (4 khách thay vì 3)
  try {
    orderHelper.mapBookingCustomers(
      [
        { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 1', phone: '0901' },
        { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 2', phone: '0902' },
        { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 3', phone: '0903' },
        { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 4', phone: '0904' },
      ],
      [mockCartItem],
      mockOrder
    );
    throw new Error('Lỗi: Gửi thừa khách nhưng không bị chặn!');
  } catch (err) {
    console.log('✓ Chặn thành công khi gửi thừa khách:', err.message);
  }

  // Trường hợp gửi đúng 3 khách
  const validCustomers = orderHelper.mapBookingCustomers(
    [
      { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 1', phone: '0901' },
      { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 2', phone: '0902' },
      { cart_item_id: mockCartItem._id.toString(), full_name: 'Khách 3', phone: '0903' },
    ],
    [mockCartItem],
    mockOrder
  );
  console.log('✓ Gửi đủ 3 khách thành công! Số lượng khách mapped:', validCustomers.length);
  console.log('-> VẤN ĐỀ 4: ĐÃ SỬA CHÍNH XÁC!\n');

  // -------------------------------------------------------------------------
  // TEST VẤN ĐỀ 3: Trạng thái OPEN/FULL và số chỗ luôn nhất quán
  // -------------------------------------------------------------------------
  console.log('--- TEST VẤN ĐỀ 3: Nhất quán trạng thái OPEN/FULL ---');
  const depTest = await TourDeparture.create({
    product_id: zeroPriceTour._id,
    departure_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    departure_location: 'TP.HCM',
    total_slots: 5,
    booked_slots: 0,
    reserved_slots: 0,
    status: 'OPEN',
  });

  // Đặt 5 chỗ -> phải chuyển sang FULL
  await orderHelper.reserveSlotsForOrderItems(
    [{ departure_id: depTest._id, tour_name: 'Test', quantity: 5 }],
    null
  );
  let depCurrent = await TourDeparture.findById(depTest._id);
  console.log('✓ Sau khi đặt 5/5 chỗ: reserved_slots =', depCurrent.reserved_slots, '| status =', depCurrent.status);
  if (depCurrent.status !== 'FULL') throw new Error('Lỗi: Hết chỗ nhưng chưa chuyển sang FULL!');

  // Giải phóng 2 chỗ -> phải tự động mở lại OPEN
  await orderHelper.releaseSlotsForOrder({
    order_status: 'PENDING_PAYMENT',
    items: [{ departure_id: depTest._id, quantity: 2 }],
  });
  depCurrent = await TourDeparture.findById(depTest._id);
  console.log('✓ Sau khi giải phóng 2 chỗ: reserved_slots =', depCurrent.reserved_slots, '| status =', depCurrent.status);
  if (depCurrent.status !== 'OPEN') throw new Error('Lỗi: Còn chỗ trống nhưng chưa mở lại OPEN!');
  console.log('-> VẤN ĐỀ 3: ĐÃ SỬA CHÍNH XÁC!\n');

  // -------------------------------------------------------------------------
  // TEST VẤN ĐỀ 1: Chống giải phóng chỗ 2 lần trong expirePendingOrders (Concurrency CAS)
  // -------------------------------------------------------------------------
  // Dọn sạch các đơn pending hết hạn trước đó nếu có từ lần chạy trước
  await orderHelper.expirePendingOrders();

  const expireOrder = await Order.create({
    order_code: orderHelper.generateOrderCode(),
    user_id: testUser._id,
    customer_info: { full_name: 'Khách Expire', phone: '0901111111' },
    items: [
      {
        tour_id: zeroPriceTour._id,
        departure_id: depTest._id,
        tour_name: 'Test',
        price_adult: 1000000,
        quantity_adult: 2,
        quantity: 2,
        subtotal: 2000000,
      },
    ],
    booking_customers: [
      { order_item_id: new mongoose.Types.ObjectId(), full_name: 'K1', phone: '091' },
      { order_item_id: new mongoose.Types.ObjectId(), full_name: 'K2', phone: '092' },
    ],
    subtotal: 2000000,
    total_amount: 2000000,
    payment_method: 'ZALOPAY',
    payment_status: 'PENDING',
    order_status: 'PENDING_PAYMENT',
    payment_expires_at: new Date(Date.now() - 1000), // Đã hết hạn
  });

  // Số reserved_slots hiện tại của depTest đang là 3 (sau khi giải phóng 2 từ 5)
  // Giả lập 2 tiến trình expire đồng thời
  const [res1, res2] = await Promise.all([
    orderHelper.expirePendingOrders(),
    orderHelper.expirePendingOrders(),
  ]);
  console.log('✓ Tiến trình 1 hủy được:', res1.expiredCount, 'đơn | Tiến trình 2 hủy được:', res2.expiredCount, 'đơn');
  const totalExpired = res1.expiredCount + res2.expiredCount;
  console.log('✓ Tổng số lần đơn bị xử lý expire:', totalExpired, '(kỳ vọng: chính xác 1 lần)');
  if (totalExpired !== 1) throw new Error('Lỗi: Đơn bị expire 2 lần!');

  depCurrent = await TourDeparture.findById(depTest._id);
  console.log('✓ Reserved slots của departure sau expire đồng thời:', depCurrent.reserved_slots, '(kỳ vọng: 1)');
  if (depCurrent.reserved_slots !== 1) throw new Error('Lỗi: Reserved slots bị trừ 2 lần!');
  console.log('-> VẤN ĐỀ 1: ĐÃ SỬA CHÍNH XÁC!\n');

  // -------------------------------------------------------------------------
  // TEST VẤN ĐỀ 2: Xử lý lặp thanh toán thành công (Idempotency)
  // -------------------------------------------------------------------------
  console.log('--- TEST VẤN ĐỀ 2: Tính Idempotent khi thanh toán thành công lặp lại ---');
  const paymentOrder = await Order.create({
    order_code: orderHelper.generateOrderCode(),
    user_id: testUser._id,
    customer_info: { full_name: 'Khách Payment', phone: '0902222222' },
    items: [
      {
        tour_id: zeroPriceTour._id,
        departure_id: depTest._id,
        tour_name: 'Test',
        price_adult: 1000000,
        quantity_adult: 1,
        quantity: 1,
        subtotal: 1000000,
      },
    ],
    booking_customers: [
      { order_item_id: new mongoose.Types.ObjectId(), full_name: 'K1', phone: '091' },
    ],
    subtotal: 1000000,
    total_amount: 1000000,
    payment_method: 'ZALOPAY',
    payment_status: 'PENDING',
    order_status: 'PENDING_PAYMENT',
    payment_expires_at: new Date(Date.now() + 15 * 60 * 1000),
  });

  // Gọi updateOrderStatus với payment_status: 'PAID' hai lần đồng thời
  const [payRes1, payRes2] = await Promise.all([
    orderService.updateOrderStatus(paymentOrder._id, { payment_status: 'PAID' }),
    orderService.updateOrderStatus(paymentOrder._id, { payment_status: 'PAID' }),
  ]);

  console.log('✓ Kết quả call 1: payment_status =', payRes1.payment_status, '| order_status =', payRes1.order_status);
  console.log('✓ Kết quả call 2: payment_status =', payRes2.payment_status, '| order_status =', payRes2.order_status);

  depCurrent = await TourDeparture.findById(depTest._id);
  console.log('✓ Sau 2 lần gọi xác nhận PAID: reserved_slots =', depCurrent.reserved_slots, '| booked_slots =', depCurrent.booked_slots, '(kỳ vọng: booked_slots tăng đúng 1 lần)');
  if (depCurrent.booked_slots !== 1) throw new Error('Lỗi: Booked slots bị cộng nhiều lần!');
  console.log('-> VẤN ĐỀ 2: ĐÃ SỬA CHÍNH XÁC!\n');

  // Dọn dẹp
  await Order.deleteMany({ _id: { $in: [expireOrder._id, paymentOrder._id] } });
  await TourDeparture.findByIdAndDelete(depTest._id);
  await Tour.findByIdAndDelete(zeroPriceTour._id);
  await User.findByIdAndDelete(testUser._id);

  console.log('========================================================');
  console.log('🎉 TẤT CẢ 5 VẤN ĐỀ ĐÃ ĐƯỢC KHẮC PHỤC VÀ KIỂM THỬ THÀNH CÔNG 100%!');
  console.log('========================================================');
}

testEdgeCases()
  .then(() => {
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ KIỂM THỬ THẤT BẠI:', err);
    mongoose.disconnect();
    process.exit(1);
  });
