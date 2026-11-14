/**
 * Seed script tạo dữ liệu mẫu đa dạng cho 4 Tour (IN_PROGRESS, NOT_STARTED hôm nay, NOT_STARTED tương lai, COMPLETED)
 * Giúp kiểm tra đầy đủ luồng Khách hàng, Nhân viên hướng dẫn và Admin.
 * Chạy bằng: node src/scripts/seed_journey_sample.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('../config/env');
require('../modules/role/role.model');
const Tour = require('../modules/tour/tour.model');
const TourDeparture = require('../modules/tour/tourDeparture.model');
const Order = require('../modules/order/order.model');
const TourJourney = require('../modules/journey/tourJourney.model');
const JourneyStop = require('../modules/journey/journeyStop.model');
const JourneyLog = require('../modules/journey/journeyLog.model');
const JourneyNotification = require('../modules/journey/journeyNotification.model');
const User = require('../modules/user/user.model');

async function seed() {
  const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB');

  // Lấy tài khoản Admin, Staff (HDV) và Customer đang ACTIVE trong DB
  const admin = await User.findOne({
    deleted_at: null,
    status: 'ACTIVE',
    roles: 'ADMIN',
  }).lean();

  const staff =
    (await User.findOne({ deleted_at: null, status: 'ACTIVE', roles: 'STAFF' }).lean()) || admin;

  const customer =
    (await User.findOne({
      deleted_at: null,
      status: 'ACTIVE',
      roles: 'CUSTOMER',
    }).lean()) || admin;

  if (!staff || !customer) {
    console.error('Không tìm thấy tài khoản STAFF/CUSTOMER hợp lệ trong DB.');
    process.exit(1);
  }

  console.log(`Admin   : ${admin?.email || 'N/A'}`);
  console.log(`Staff   : ${staff.email} (${staff._id})`);
  console.log(`Customer: ${customer.email} (${customer._id})\n`);

  // Dọn các đơn mẫu cũ nếu chạy lại script
  const oldSampleOrders = await Order.find({ order_code: { $regex: '^ORD-SAMPLE-JRN-' } }).lean();
  const oldDepIds = oldSampleOrders.flatMap((o) => o.items.map((i) => i.departure_id)).filter(Boolean);
  if (oldDepIds.length > 0) {
    const oldJourneys = await TourJourney.find({ departure_id: { $in: oldDepIds } }).lean();
    const oldJourneyIds = oldJourneys.map((j) => j._id);
    await JourneyLog.deleteMany({ journey_id: { $in: oldJourneyIds } });
    await JourneyStop.deleteMany({ journey_id: { $in: oldJourneyIds } });
    await JourneyNotification.deleteMany({ journey_id: { $in: oldJourneyIds } });
    await TourJourney.deleteMany({ _id: { $in: oldJourneyIds } });
    await TourDeparture.deleteMany({ _id: { $in: oldDepIds } });
    await Order.deleteMany({ _id: { $in: oldSampleOrders.map((o) => o._id) } });
    console.log('Đã dọn dữ liệu mẫu hành trình cũ.\n');
  }

  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000);
  const hoursLater = (h) => new Date(now.getTime() + h * 3600 * 1000);
  const daysFromNow = (d, hour = 7) => {
    const dt = new Date(now.getTime() + d * 86400 * 1000);
    dt.setHours(hour, 30, 0, 0);
    return dt;
  };

  const sampleConfigs = [
    {
      tourCode: 'NDSGN602-DL',
      orderCode: 'ORD-SAMPLE-JRN-01',
      startDatetime: hoursAgo(4),
      meetingPoint: 'Quảng trường Lâm Viên, TP. Đà Lạt',
      journeyStatus: 'IN_PROGRESS',
      progress: 50,
      startedAt: hoursAgo(4),
      stops: [
        {
          name: 'Quảng trường Lâm Viên',
          description: 'Tập trung đoàn, chụp ảnh cùng biểu tượng hoa Dã Quỳ.',
          address: 'Đường Trần Quốc Toản, P.1, Đà Lạt',
          latitude: 11.9404,
          longitude: 108.4425,
          day_number: 1,
          planned_start: hoursAgo(4),
          planned_end: hoursAgo(3),
          status: 'COMPLETED',
          departed_at: hoursAgo(4),
          arrived_at: hoursAgo(3.8),
          completed_at: hoursAgo(3),
        },
        {
          name: 'Khu du lịch Thác Datanla',
          description: 'Trải nghiệm máng trượt xuyên rừng thông và ngắm thác Datanla.',
          address: 'QL20 Đèo Prenn, P.3, Đà Lạt',
          latitude: 11.9038,
          longitude: 108.4494,
          day_number: 1,
          planned_start: hoursAgo(2.5),
          planned_end: hoursAgo(1),
          status: 'COMPLETED',
          departed_at: hoursAgo(2.8),
          arrived_at: hoursAgo(2.4),
          completed_at: hoursAgo(1.1),
        },
        {
          name: 'Đồi Chè Cầu Đất',
          description: 'Tham quan đồi chè xanh mướt và thưởng thức trà nóng.',
          address: 'Xuân Trường, TP. Đà Lạt, Lâm Đồng',
          latitude: 11.8842,
          longitude: 108.5628,
          day_number: 1,
          planned_start: hoursAgo(0.5),
          planned_end: hoursLater(1.5),
          status: 'VISITING',
          departed_at: hoursAgo(1),
          arrived_at: hoursAgo(0.3),
        },
        {
          name: 'Đỉnh Langbiang',
          description: 'Chinh phục nóc nhà Tây Nguyên bằng xe Jeep và ngắm toàn cảnh Đà Lạt.',
          address: 'Thị trấn Lạc Dương, Lâm Đồng',
          latitude: 12.0445,
          longitude: 108.4368,
          day_number: 2,
          planned_start: hoursLater(3),
          planned_end: hoursLater(5),
          status: 'PENDING',
        },
      ],
    },
    {
      tourCode: 'NDSGN302-DNH',
      orderCode: 'ORD-SAMPLE-JRN-02',
      startDatetime: hoursAgo(1),
      meetingPoint: 'Sảnh Ga Đến Quốc Nội - Sân bay Đà Nẵng',
      journeyStatus: 'NOT_STARTED',
      progress: 0,
      stops: [
        {
          name: 'Cầu Rồng & Bờ sông Hàn',
          description: 'Đón đoàn tại Đà Nẵng, dạo bộ và check-in biểu tượng thành phố.',
          address: 'Đường Bạch Đằng, Hải Châu, Đà Nẵng',
          latitude: 16.0611,
          longitude: 108.2279,
          day_number: 1,
          planned_start: hoursLater(1),
          planned_end: hoursLater(2.5),
          status: 'PENDING',
        },
        {
          name: 'Danh thắng Ngũ Hành Sơn',
          description: 'Khám phá động Huyền Không, chùa Linh Ứng và làng đá mỹ nghệ Non Nước.',
          address: '81 Huyền Trân Công Chúa, Ngũ Hành Sơn, Đà Nẵng',
          latitude: 16.0033,
          longitude: 108.2644,
          day_number: 1,
          planned_start: hoursLater(3),
          planned_end: hoursLater(5),
          status: 'PENDING',
        },
        {
          name: 'Phố cổ Hội An',
          description: 'Tham quan Chùa Cầu, thả đèn hoa đăng trên sông Hoài.',
          address: 'Minh An, Hội An, Quảng Nam',
          latitude: 15.877,
          longitude: 108.3263,
          day_number: 1,
          planned_start: hoursLater(6),
          planned_end: hoursLater(9),
          status: 'PENDING',
        },
        {
          name: 'Khu du lịch Bà Nà Hills',
          description: 'Trải nghiệm cáp treo đạt kỷ lục thế giới và check-in Cầu Vàng.',
          address: 'Hòa Ninh, Hòa Vang, Đà Nẵng',
          latitude: 15.9977,
          longitude: 107.9881,
          day_number: 2,
          planned_start: daysFromNow(1, 8),
          planned_end: daysFromNow(1, 16),
          status: 'PENDING',
        },
        {
          name: 'Đại Nội Kinh Thành Huế',
          description: 'Tham quan Ngọ Môn, Điện Thái Hòa và tìm hiểu lịch sử triều Nguyễn.',
          address: 'Thuận Hòa, TP. Huế',
          latitude: 16.4698,
          longitude: 107.5786,
          day_number: 3,
          planned_start: daysFromNow(2, 9),
          planned_end: daysFromNow(2, 12),
          status: 'PENDING',
        },
      ],
    },
    {
      tourCode: 'NDSGN850-PQ',
      orderCode: 'ORD-SAMPLE-JRN-03',
      startDatetime: daysFromNow(2, 8),
      meetingPoint: 'Cổng chính Grand World Phú Quốc',
      journeyStatus: 'NOT_STARTED',
      progress: 0,
      stops: [
        {
          name: 'Thành phố không ngủ Grand World',
          description: 'Check-in kênh đào Venice thu nhỏ và bảo tàng gấu Teddy.',
          address: 'Bãi Dài, Gành Dầu, Phú Quốc',
          latitude: 10.3359,
          longitude: 103.8588,
          day_number: 1,
          planned_start: daysFromNow(2, 9),
          planned_end: daysFromNow(2, 12),
          status: 'PENDING',
        },
        {
          name: 'Vinpearl Safari Phú Quốc',
          description: 'Tham quan công viên chăm sóc và bảo tồn động vật bán hoang dã.',
          address: 'Bãi Dài, Gành Dầu, Phú Quốc',
          latitude: 10.3436,
          longitude: 103.8907,
          day_number: 1,
          planned_start: daysFromNow(2, 14),
          planned_end: daysFromNow(2, 17),
          status: 'PENDING',
        },
        {
          name: 'Cáp treo Hòn Thơm',
          description: 'Ngắm toàn cảnh quần đảo An Thới từ tuyến cáp treo vượt biển 3 dây.',
          address: 'An Thới, Phú Quốc, Kiên Giang',
          latitude: 10.0038,
          longitude: 104.0176,
          day_number: 2,
          planned_start: daysFromNow(3, 9),
          planned_end: daysFromNow(3, 15),
          status: 'PENDING',
        },
        {
          name: 'Chợ đêm Dương Đông',
          description: 'Thưởng thức hải sản tươi sống và mua sắm đặc sản địa phương.',
          address: 'Đường Bạch Đằng, Dương Đông, Phú Quốc',
          latitude: 10.2175,
          longitude: 103.9591,
          day_number: 2,
          planned_start: daysFromNow(3, 18),
          planned_end: daysFromNow(3, 21),
          status: 'PENDING',
        },
      ],
    },
    {
      tourCode: 'NDSGN102-HLNB',
      orderCode: 'ORD-SAMPLE-JRN-04',
      startDatetime: daysFromNow(-3, 7),
      meetingPoint: 'Nhà Hát Lớn Hà Nội',
      journeyStatus: 'COMPLETED',
      progress: 100,
      startedAt: daysFromNow(-3, 7),
      completedAt: daysFromNow(-1, 18),
      stops: [
        {
          name: 'Hồ Hoàn Kiếm & Phố Cổ Hà Nội',
          description: 'Đón khách tại trung tâm Hà Nội, khởi hành đi Hạ Long.',
          address: 'Hoàn Kiếm, Hà Nội',
          latitude: 21.0287,
          longitude: 105.8524,
          day_number: 1,
          planned_start: daysFromNow(-3, 7),
          planned_end: daysFromNow(-3, 8),
          status: 'COMPLETED',
          departed_at: daysFromNow(-3, 7),
          arrived_at: daysFromNow(-3, 7),
          completed_at: daysFromNow(-3, 8),
        },
        {
          name: 'Cảng Tuần Châu - Du thuyền Vịnh Hạ Long',
          description: 'Lên du thuyền cao cấp tham quan kỳ quan thiên nhiên thế giới.',
          address: 'Tuần Châu, TP. Hạ Long, Quảng Ninh',
          latitude: 20.9225,
          longitude: 106.985,
          day_number: 1,
          planned_start: daysFromNow(-3, 11),
          planned_end: daysFromNow(-3, 17),
          status: 'COMPLETED',
          departed_at: daysFromNow(-3, 8),
          arrived_at: daysFromNow(-3, 11),
          completed_at: daysFromNow(-3, 17),
        },
        {
          name: 'Hang Sửng Sốt',
          description: 'Khám phá hang động thạch nhũ nổi tiếng trên Vịnh Hạ Long.',
          address: 'Đảo Bồ Hòn, Vịnh Hạ Long',
          latitude: 20.8442,
          longitude: 107.0956,
          day_number: 2,
          planned_start: daysFromNow(-2, 8),
          planned_end: daysFromNow(-2, 10),
          status: 'SKIPPED',
          skipped_reason: 'Thời tiết có gió lớn, Ban quản lý vịnh tạm đóng cửa tham quan hang động.',
        },
        {
          name: 'Chùa Bái Đính (Điểm thay thế)',
          description: 'Điểm tham quan tâm linh bổ sung thay cho Hang Sửng Sốt.',
          address: 'Gia Sinh, Gia Viễn, Ninh Bình',
          latitude: 20.2736,
          longitude: 105.8623,
          day_number: 2,
          planned_start: daysFromNow(-2, 14),
          planned_end: daysFromNow(-2, 17),
          status: 'COMPLETED',
          is_additional: true,
          added_by: staff._id,
          departed_at: daysFromNow(-2, 13),
          arrived_at: daysFromNow(-2, 14),
          completed_at: daysFromNow(-2, 17),
        },
        {
          name: 'Khu du lịch sinh thái Tràng An',
          description: 'Đi thuyền nan ngắm cảnh sông núi non nước hữu tình.',
          address: 'Trường Yên, Hoa Lư, Ninh Bình',
          latitude: 20.2506,
          longitude: 105.8972,
          day_number: 3,
          planned_start: daysFromNow(-1, 8),
          planned_end: daysFromNow(-1, 12),
          status: 'COMPLETED',
          departed_at: daysFromNow(-1, 8),
          arrived_at: daysFromNow(-1, 8),
          completed_at: daysFromNow(-1, 12),
        },
      ],
    },
  ];

  for (const cfg of sampleConfigs) {
    const tour = await Tour.findOne({ code: cfg.tourCode, deleted_at: null }).lean();
    if (!tour) {
      console.warn(`⚠️ Không tìm thấy tour ${cfg.tourCode}, bỏ qua.`);
      continue;
    }

    const departure = await TourDeparture.create({
      product_id: tour._id,
      start_datetime: cfg.startDatetime,
      meeting_point: cfg.meetingPoint,
      total_slots: 25,
      booked_slots: 4,
      reserved_slots: 0,
      status: 'OPEN',
    });

    await Order.create({
      order_code: cfg.orderCode,
      user_id: customer._id,
      customer_info: {
        full_name: customer.full_name,
        phone: customer.phone || '0901234567',
        email: customer.email,
      },
      items: [
        {
          tour_id: tour._id,
          departure_id: departure._id,
          tour_name: tour.title,
          tour_code: tour.code,
          main_image: tour.main_image,
          departure_date: cfg.startDatetime,
          meeting_point: cfg.meetingPoint,
          duration: tour.duration,
          price_adult: tour.sale_price || tour.original_price,
          quantity_adult: 2,
          quantity: 2,
          subtotal: (tour.sale_price || tour.original_price) * 2,
        },
      ],
      subtotal: (tour.sale_price || tour.original_price) * 2,
      total_amount: (tour.sale_price || tour.original_price) * 2,
      paid_amount: (tour.sale_price || tour.original_price) * 2,
      order_status: cfg.journeyStatus === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
      payment_status: 'PAID',
      payment_method: 'ZALOPAY',
    });

    const journey = await TourJourney.create({
      departure_id: departure._id,
      tour_id: tour._id,
      guide_id: staff._id,
      status: cfg.journeyStatus,
      progress: cfg.progress,
      started_at: cfg.startedAt || null,
      completed_at: cfg.completedAt || null,
    });

    const stopDocs = await JourneyStop.insertMany(
      cfg.stops.map((s, idx) => ({
        ...s,
        journey_id: journey._id,
        order: idx,
      }))
    );

    // Tạo log & notification mẫu cho hành trình đang diễn ra / hoàn thành
    await JourneyLog.create({
      journey_id: journey._id,
      stop_id: null,
      performed_by: admin ? admin._id : staff._id,
      action: 'JOURNEY_CREATED',
      new_value: { stops_count: stopDocs.length, guide_id: staff._id },
      reason: 'Khởi tạo hành trình mẫu từ hệ thống',
    });

    if (cfg.journeyStatus === 'IN_PROGRESS') {
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: null,
        performed_by: staff._id,
        action: 'JOURNEY_STARTED',
        old_value: { status: 'NOT_STARTED' },
        new_value: { status: 'IN_PROGRESS' },
        reason: 'Nhân viên bắt đầu hành trình theo lịch khởi hành',
      });
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: stopDocs[2]._id,
        performed_by: staff._id,
        action: 'STOP_STATUS_CHANGED',
        old_value: { status: 'TRAVELLING' },
        new_value: { status: 'VISITING' },
        reason: 'Đoàn đã đến Đồi Chè Cầu Đất',
      });

      await JourneyNotification.insertMany([
        {
          journey_id: journey._id,
          recipient_id: customer._id,
          type: 'JOURNEY_STARTED',
          title: 'Hành trình đã bắt đầu',
          message: `Đoàn ${tour.title} đã chính thức khởi hành tại ${cfg.meetingPoint}.`,
        },
        {
          journey_id: journey._id,
          recipient_id: customer._id,
          type: 'STATUS_UPDATE',
          title: 'Đoàn đang tham quan: Đồi Chè Cầu Đất',
          message: 'Hướng dẫn viên xác nhận đoàn đã đến Đồi Chè Cầu Đất.',
        },
      ]);
    }

    if (cfg.journeyStatus === 'COMPLETED') {
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: stopDocs[2]._id,
        performed_by: staff._id,
        action: 'STOP_SKIPPED',
        old_value: { status: 'PENDING' },
        new_value: { status: 'SKIPPED', skipped_reason: stopDocs[2].skipped_reason },
        reason: stopDocs[2].skipped_reason,
      });
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: stopDocs[3]._id,
        performed_by: staff._id,
        action: 'STOP_ADDED',
        new_value: { name: stopDocs[3].name },
        reason: 'Bổ sung điểm thay thế do không vào được Hang Sửng Sốt',
      });
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: null,
        performed_by: staff._id,
        action: 'JOURNEY_COMPLETED',
        old_value: { status: 'IN_PROGRESS' },
        new_value: { status: 'COMPLETED' },
        reason: 'Hoàn thành toàn bộ hành trình',
      });
    }

    console.log(`✅ Đã tạo hành trình [${cfg.journeyStatus}] cho tour ${tour.code} (${journey._id})`);
  }

  console.log('\n🎉 Hoàn tất tạo dữ liệu mẫu cho 4 tour!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
