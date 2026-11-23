/**
 * Tạo bộ dữ liệu thử thông báo cho Customer và các luồng thao tác Admin.
 * Chạy tại backend bằng: npm run seed:notification-demo
 * Script chỉ tạo/cập nhật các bản ghi có mã ORD-SEED-NOTI-* và thông báo
 * mang metadata.seedTag tương ứng; không xóa dữ liệu thật.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('../config/env');
const User = require('../modules/user/user.model');
const Tour = require('../modules/tour/tour.model');
const TourDeparture = require('../modules/tour/tourDeparture.model');
const Order = require('../modules/order/order.model');
const Album = require('../modules/souvenir/models/album.model');
const AlbumPhoto = require('../modules/souvenir/models/albumPhoto.model');
const SouvenirCard = require('../modules/souvenir/models/souvenirCard.model');
const Notification = require('../modules/notification/notification.model');

const SEED_TAG = 'tourgo-notification-demo-v1';
const UPCOMING_MEETING_POINT = '[SEED-NOTI] Điểm tập trung tour mẫu';
const COMPLETED_MEETING_POINT = '[SEED-NOTI] Tour mẫu đã hoàn thành';
const UPCOMING_ORDER_CODE = 'ORD-SEED-NOTI-UPCOMING';
const SOUVENIR_ORDER_CODE = 'ORD-SEED-NOTI-SOUVENIR';

const dateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(8, 0, 0, 0);
  return date;
};

const getImagePublicId = (url) => {
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return 'tourgo-seed/notification-demo';

  let path = url.slice(uploadIndex + '/upload/'.length).split('?')[0];
  const version = path.match(/(?:^|\/)v\d+\/(.*)$/);
  if (version) path = version[1];
  return path.replace(/\.[^/.]+$/, '');
};

async function findRequiredAccounts() {
  const [customer, admin, staff] = await Promise.all([
    User.findOne({ status: 'ACTIVE', deleted_at: null, roles: 'CUSTOMER' }).lean(),
    User.findOne({ status: 'ACTIVE', deleted_at: null, roles: 'ADMIN' }).lean(),
    User.findOne({ status: 'ACTIVE', deleted_at: null, roles: 'STAFF' }).lean(),
  ]);

  if (!customer) throw new Error('Cần có ít nhất một tài khoản CUSTOMER đang ACTIVE.');
  if (!admin) throw new Error('Cần có ít nhất một tài khoản ADMIN đang ACTIVE.');
  return { customer, admin, staff: staff || admin };
}

async function findDemoTour() {
  const existingDeparture = await TourDeparture.findOne({
    meeting_point: { $in: [UPCOMING_MEETING_POINT, COMPLETED_MEETING_POINT] },
    deleted_at: null,
  }).lean();

  let tour = existingDeparture
    ? await Tour.findOne({ _id: existingDeparture.product_id, deleted_at: null }).lean()
    : null;
  if (!tour) {
    tour = await Tour.findOne({ status: 'ACTIVE', deleted_at: null }).lean();
  }
  if (!tour) {
    tour = await Tour.findOne({ deleted_at: null }).lean();
  }

  if (!tour) throw new Error('Không tìm thấy tour mẫu. Hãy tạo ít nhất một tour ACTIVE trước.');
  if (!tour.main_image) throw new Error(`Tour ${tour.code} chưa có ảnh đại diện để làm ảnh thiệp.`);
  return tour;
}

async function ensureDeparture({ tour, meetingPoint, daysFromNow, status, bookedSlots }) {
  let departure = await TourDeparture.findOne({ meeting_point: meetingPoint, deleted_at: null });
  if (!departure) departure = new TourDeparture();

  departure.product_id = tour._id;
  departure.start_datetime = dateAfterDays(daysFromNow);
  departure.meeting_point = meetingPoint;
  departure.total_slots = 20;
  departure.booked_slots = bookedSlots;
  departure.reserved_slots = 0;
  departure.status = status;
  departure.deleted_at = null;
  await departure.save();
  return departure;
}

async function ensureOrder({ orderCode, customer, tour, departure, passengerNames, status }) {
  let order = await Order.findOne({ order_code: orderCode });
  if (!order) order = new Order({ order_code: orderCode });

  const itemId = order.items?.[0]?._id || new mongoose.Types.ObjectId();
  const oldBookingCustomers = order.booking_customers || [];
  const bookingCustomers = passengerNames.map((fullName, index) => ({
    _id: oldBookingCustomers[index]?._id || new mongoose.Types.ObjectId(),
    order_item_id: itemId,
    full_name: fullName,
    phone: customer.phone || '0900000000',
    email: index === 0 ? customer.email : null,
    gender: index === 0 ? (customer.gender || null) : null,
  }));
  const quantity = bookingCustomers.length;
  const unitPrice = Number(tour.sale_price || tour.original_price || 1000000);
  const subtotal = unitPrice * quantity;

  order.user_id = customer._id;
  order.customer_info = {
    full_name: customer.full_name,
    phone: customer.phone || '0900000000',
    email: customer.email,
    note: 'Đơn dữ liệu mẫu thông báo TourGo',
  };
  order.items = [{
    _id: itemId,
    tour_id: tour._id,
    departure_id: departure._id,
    tour_name: tour.title,
    tour_code: tour.code,
    main_image: tour.main_image,
    departure_date: departure.start_datetime,
    departure_location: tour.destination_location || '',
    meeting_point: departure.meeting_point,
    duration: tour.duration || '',
    price_adult: unitPrice,
    quantity_adult: quantity,
    quantity,
    subtotal,
  }];
  order.booking_customers = bookingCustomers;
  order.subtotal = subtotal;
  order.discount_amount = 0;
  order.total_amount = subtotal;
  order.paid_amount = subtotal;
  order.remaining_amount = 0;
  order.payment_method = 'ZALOPAY';
  order.payment_type = 'FULL';
  order.payment_status = 'PAID';
  order.order_status = status;
  order.cancel_type = null;
  await order.save();
  return order;
}

async function ensureSouvenirFixtures({ tour, departure, order, staff, admin }) {
  const image = {
    url: tour.main_image,
    public_id: getImagePublicId(tour.main_image),
    thumbnail_url: tour.main_image,
  };

  let album = await Album.findOne({ departure_id: departure._id, deleted_at: null });
  if (!album) album = new Album({ departure_id: departure._id });
  album.tour_id = tour._id;
  album.title = `[SEED-NOTI] Album kỷ niệm ${tour.title}`;
  album.description = 'Album mẫu để kiểm tra luồng duyệt và phát hành thiệp.';
  album.cover_photo = image;
  album.status = 'ACTIVE';
  album.allow_download = true;
  album.created_by = staff._id;
  album.deleted_at = null;
  await album.save();

  const photoMarker = 'seed-notification-demo-photo.jpg';
  let photo = await AlbumPhoto.findOne({ album_id: album._id, original_filename: photoMarker });
  if (!photo) photo = new AlbumPhoto({ album_id: album._id, original_filename: photoMarker });
  photo.departure_id = departure._id;
  photo.url = image.url;
  photo.thumbnail_url = image.thumbnail_url;
  photo.public_id = image.public_id;
  photo.file_size = 0;
  photo.mime_type = 'image/jpeg';
  photo.width = 1200;
  photo.height = 800;
  photo.category = 'GROUP';
  photo.visibility = 'SHARED';
  photo.caption = 'Ảnh mẫu trong chuyến đi TourGo';
  photo.assigned_customers = [];
  photo.uploaded_by = staff._id;
  photo.sort_order = 1;
  photo.deleted_at = null;
  await photo.save();
  album.photo_count = 1;
  await album.save();

  const item = order.items[0];
  const passengers = order.booking_customers;
  const cardStates = ['PUBLISHED', 'APPROVED', 'PENDING_REVIEW', 'DRAFT'];
  const now = new Date();
  const cards = [];

  for (let index = 0; index < passengers.length; index += 1) {
    const passenger = passengers[index];
    const status = cardStates[index] || 'DRAFT';
    let card = await SouvenirCard.findOne({
      order_id: order._id,
      order_item_id: item._id,
      booking_customer_id: passenger._id,
      deleted_at: null,
    });
    if (!card) card = new SouvenirCard();

    card.album_id = album._id;
    card.departure_id = departure._id;
    card.tour_id = tour._id;
    card.order_id = order._id;
    card.order_item_id = item._id;
    card.booking_customer_id = passenger._id;
    card.owner_user_id = order.user_id;
    card.recipient_name = passenger.full_name;
    card.recipient_email = passenger.email || order.customer_info.email || null;
    card.customer_snapshot = {
      full_name: passenger.full_name,
      phone: passenger.phone,
      email: passenger.email,
      gender: passenger.gender,
    };
    card.tour_info_snapshot = {
      tour_name: tour.title,
      tour_code: tour.code,
      departure_date: departure.start_datetime,
      end_date: departure.start_datetime,
      duration: tour.duration || '',
      departure_location: tour.destination_location || '',
      meeting_point: departure.meeting_point,
    };
    card.cover_photo = image;
    card.greeting_message = `Kính gửi ${passenger.full_name}, cảm ơn bạn đã đồng hành cùng TourGo trong chuyến đi ${tour.title}.`;
    card.personal_message = 'Chúc bạn lưu giữ thật nhiều kỷ niệm đẹp!';
    card.personal_photo_ids = [];
    card.status = status;
    const isReviewed = ['APPROVED', 'PUBLISHED'].includes(status);
    card.reviewed_at = isReviewed ? now : null;
    card.reviewed_by = isReviewed ? admin._id : null;
    card.review_comment = isReviewed ? 'Thiệp mẫu đã được duyệt.' : '';
    card.published_at = status === 'PUBLISHED' ? now : null;
    card.published_by = status === 'PUBLISHED' ? admin._id : null;
    card.email_status = 'NOT_SENT';
    card.customer_viewed = false;
    card.view_count = 0;
    card.created_by = staff._id;
    card.deleted_at = null;
    card.review_history = status === 'DRAFT' ? [] : [
      {
        action: 'SUBMIT',
        actor_id: staff._id,
        from_status: 'DRAFT',
        to_status: 'PENDING_REVIEW',
        comment: 'Seed mẫu gửi duyệt.',
        created_at: now,
      },
      ...(isReviewed ? [{
        action: 'APPROVE',
        actor_id: admin._id,
        from_status: 'PENDING_REVIEW',
        to_status: 'APPROVED',
        comment: 'Seed mẫu đã duyệt.',
        created_at: now,
      }] : []),
      ...(status === 'PUBLISHED' ? [{
        action: 'PUBLISH',
        actor_id: admin._id,
        from_status: 'APPROVED',
        to_status: 'PUBLISHED',
        comment: 'Thiệp mẫu đã phát hành trước đó.',
        created_at: now,
      }] : []),
    ];

    await card.save();
    cards.push(card);
  }

  return { album, cards };
}

async function seedCustomerNotifications({ customer, upcomingOrder, souvenirOrder, publishedCard }) {
  await Notification.deleteMany({
    recipientId: customer._id,
    recipientType: 'customer',
    'metadata.seedTag': SEED_TAG,
  });

  const upcomingLink = `/don-hang/${upcomingOrder._id}`;
  const souvenirLink = `/don-hang/${souvenirOrder._id}`;
  const cardLink = `/account/souvenirs/${publishedCard.public_code}`;
  const rows = [
    ['ORDER_CREATED', 'Đặt tour thành công!', `Đơn #${UPCOMING_ORDER_CODE} đã được tạo.`, upcomingLink],
    ['PAYMENT_SUCCESS', 'Thanh toán thành công!', 'Thanh toán cho đơn mẫu đã được xác nhận.', upcomingLink],
    ['CANCEL_REQUESTED', 'Yêu cầu hủy đã được tiếp nhận', 'Nhân viên sẽ xử lý yêu cầu hủy đơn mẫu.', upcomingLink],
    ['CANCEL_APPROVED', 'Yêu cầu hủy tour được chấp nhận', 'Yêu cầu hủy đơn mẫu đã được duyệt.', upcomingLink],
    ['CANCEL_REJECTED', 'Yêu cầu hủy tour bị từ chối', 'Đây là thông báo mẫu để kiểm tra giao diện.', upcomingLink],
    ['REFUND_SUCCESS', 'Hoàn tiền thành công', 'Khoản hoàn mẫu đã được xử lý.', upcomingLink],
    ['DEPARTURE_CHANGED', 'Lịch khởi hành tour đã thay đổi', 'Lịch chuyến mẫu có cập nhật mới.', upcomingLink],
    ['DEPARTURE_CANCELLED', 'Chuyến đi đã bị hủy', 'Thông báo mẫu về chuyến đi.', souvenirLink],
    ['MEETING_POINT_CHANGED', 'Cập nhật điểm tập trung', 'Điểm tập trung của chuyến mẫu đã thay đổi.', upcomingLink],
    ['CARD_PUBLISHED', 'Thiệp kỷ niệm của bạn đã sẵn sàng!', 'Thiệp mẫu đã phát hành, hãy mở để xem.', cardLink],
  ];

  await Notification.insertMany(rows.map(([eventType, title, body, link], index) => ({
    recipientId: customer._id,
    recipientType: 'customer',
    eventType,
    title,
    body,
    link,
    metadata: { seedTag: SEED_TAG },
    isRead: index % 3 === 0,
    createdAt: new Date(Date.now() - index * 60 * 1000),
  })));
}

async function seed() {
  await mongoose.connect(MONGO_URI || 'mongodb://127.0.0.1:27017/tour_booking_db');
  console.log('Đã kết nối MongoDB.');

  const { customer, admin, staff } = await findRequiredAccounts();
  const tour = await findDemoTour();
  const upcomingDeparture = await ensureDeparture({
    tour,
    meetingPoint: UPCOMING_MEETING_POINT,
    daysFromNow: 21,
    status: 'OPEN',
    bookedSlots: 2,
  });
  const completedDeparture = await ensureDeparture({
    tour,
    meetingPoint: COMPLETED_MEETING_POINT,
    daysFromNow: -14,
    status: 'COMPLETED',
    bookedSlots: 4,
  });

  const upcomingOrder = await ensureOrder({
    orderCode: UPCOMING_ORDER_CODE,
    customer,
    tour,
    departure: upcomingDeparture,
    passengerNames: [customer.full_name, 'Hành khách mẫu TourGo'],
    status: 'CONFIRMED',
  });
  const souvenirOrder = await ensureOrder({
    orderCode: SOUVENIR_ORDER_CODE,
    customer,
    tour,
    departure: completedDeparture,
    passengerNames: [
      customer.full_name,
      'Hành khách mẫu 2',
      'Hành khách mẫu 3',
      'Hành khách mẫu 4',
    ],
    status: 'COMPLETED',
  });

  const { album, cards } = await ensureSouvenirFixtures({
    tour,
    departure: completedDeparture,
    order: souvenirOrder,
    staff,
    admin,
  });
  const publishedCard = cards.find((card) => card.status === 'PUBLISHED');
  await seedCustomerNotifications({ customer, upcomingOrder, souvenirOrder, publishedCard });

  console.log('\nSeed thông báo hoàn tất:');
  console.log(`Customer ID: ${customer._id}`);
  console.log(`Admin ID: ${admin._id}`);
  console.log(`Tour mẫu: ${tour.title} (${tour.code})`);
  console.log(`Đơn sắp khởi hành: ${UPCOMING_ORDER_CODE} — ${upcomingDeparture._id}`);
  console.log(`Đơn/album thiệp: ${SOUVENIR_ORDER_CODE} — ${album._id}`);
  console.log('Thiệp mẫu: 1 PUBLISHED, 1 APPROVED (phát hành để gửi email), 1 PENDING_REVIEW, 1 DRAFT.');
  console.log('Khách kiểm tra chuông: đăng nhập Customer → mở chuông thông báo hoặc Hồ sơ cá nhân → Thông báo.');
  console.log('Admin kiểm tra thiệp: /admin/souvenirs → mở chuyến đã hoàn thành; /admin/souvenirs/review-queue để duyệt/phát hành.');
  console.log('Để thử email đổi điểm tập trung, sửa điểm của đợt OPEN mẫu trong trang quản lý tour.');
  console.log('Seed chỉ tạo dữ liệu; không tự gửi email.');

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Không thể tạo seed thông báo:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
