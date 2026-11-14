/**
 * Test script cho Module Hành Trình Tour (Tour Journey Tracking)
 * Kiểm tra toàn bộ nghiệp vụ, state machine, phân quyền, concurrency & logs.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('../src/config/env');
const User = require('../src/modules/user/user.model');
const Tour = require('../src/modules/tour/tour.model');
const TourDeparture = require('../src/modules/tour/tourDeparture.model');
const Order = require('../src/modules/order/order.model');
const TourJourney = require('../src/modules/journey/tourJourney.model');
const JourneyStop = require('../src/modules/journey/journeyStop.model');
const JourneyLog = require('../src/modules/journey/journeyLog.model');
const JourneyNotification = require('../src/modules/journey/journeyNotification.model');
const journeyService = require('../src/modules/journey/journey.service');
const journeyAdminService = require('../src/modules/journey/journeyAdmin.service');

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${msg}`);
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
  }
}

async function expectError(fn, expectedStatus, msg) {
  total++;
  try {
    await fn();
    console.error(`  ❌ [FAIL] ${msg} (Expected error ${expectedStatus} but succeeded)`);
  } catch (err) {
    if (!expectedStatus || err.statusCode === expectedStatus) {
      passed++;
      console.log(`  ✅ [PASS] ${msg} (Status ${err.statusCode}: ${err.message})`);
    } else {
      console.error(`  ❌ [FAIL] ${msg} (Expected status ${expectedStatus}, got ${err.statusCode}: ${err.message})`);
    }
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE HÀNH TRÌNH TOUR');
  console.log('====================================================\n');

  const ts = Date.now();
  let createdTourId = null;
  let createdDepIds = [];
  let createdJourneyIds = [];
  let createdOrderId = null;

  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB.\n');

    // Mock users: Admin, Guide 1, Guide 2, Customer A (has order), Customer B (no order)
    const upsertUser = (email, fullName, roles) =>
      User.findOneAndUpdate(
        { email },
        {
          full_name: fullName,
          email,
          phone: '0901234567',
          password_hash: 'mockhash123',
          roles,
          status: 'ACTIVE',
          deleted_at: null,
        },
        { upsert: true, new: true }
      );

    const adminUser = await upsertUser(`j_admin_${ts}@test.com`, 'Admin Journey', ['ADMIN']);
    const guide1 = await upsertUser(`j_guide1_${ts}@test.com`, 'HDV Tuan', ['STAFF']);
    const guide2 = await upsertUser(`j_guide2_${ts}@test.com`, 'HDV Lan', ['STAFF']);
    const customerA = await upsertUser(`j_custA_${ts}@test.com`, 'Khach A', ['CUSTOMER']);
    const customerB = await upsertUser(`j_custB_${ts}@test.com`, 'Khach B', ['CUSTOMER']);

    // Create mock Tour with itinerary
    const originalItinerary = [
      { day_title: 'Điểm 1: Bảo tàng', description: 'Tham quan bảo tàng', order: 0 },
      { day_title: 'Điểm 2: Hồ trung tâm', description: 'Dạo hồ và chụp ảnh', order: 1 },
      { day_title: 'Điểm 3: Chợ đêm', description: 'Ẩm thực địa phương', order: 2 },
    ];
    const tour = await Tour.create({
      code: `JRN-TEST-${ts}`,
      title: 'Tour Hành Trình Kiểm Thử',
      category: 'DOMESTIC',
      destination_location: 'Đà Lạt',
      duration: '1 Ngày',
      original_price: 1500000,
      sale_price: 1500000,
      main_image: 'https://example.com/tour.jpg',
      itinerary: originalItinerary,
      status: 'ACTIVE',
    });
    createdTourId = tour._id;

    // Departure 1: Tomorrow (cannot start yet)
    const futureDep = await TourDeparture.create({
      product_id: tour._id,
      start_datetime: new Date(Date.now() + 2 * 86400000),
      meeting_point: 'Nhà văn hóa Thanh Niên',
      total_slots: 20,
      booked_slots: 2,
      status: 'OPEN',
    });
    createdDepIds.push(futureDep._id);

    const { journey: futureJourney } = await journeyAdminService.createJourney({
      departure_id: futureDep._id,
      guide_id: guide1._id,
      actor: adminUser,
    });
    createdJourneyIds.push(futureJourney._id);

    await expectError(
      () => journeyService.startJourney(futureJourney._id, guide1),
      400,
      'Chặn bắt đầu hành trình trước ngày khởi hành'
    );

    // Departure 2: Today (can start)
    const todayDep = await TourDeparture.create({
      product_id: tour._id,
      start_datetime: new Date(),
      meeting_point: 'Quảng trường Lâm Viên',
      total_slots: 20,
      booked_slots: 2,
      status: 'OPEN',
    });
    createdDepIds.push(todayDep._id);

    const { journey, stops } = await journeyAdminService.createJourney({
      departure_id: todayDep._id,
      guide_id: guide1._id,
      actor: adminUser,
    });
    createdJourneyIds.push(journey._id);

    assert(stops.length === 3, 'Sao chép đúng 3 điểm dừng từ lịch trình Tour');

    // Create confirmed order for Customer A on todayDep
    const order = await Order.create({
      order_code: `ORD-JRN-${ts}`,
      user_id: customerA._id,
      customer_info: { full_name: customerA.full_name, phone: '0901234567', email: customerA.email },
      items: [
        {
          tour_id: tour._id,
          departure_id: todayDep._id,
          tour_name: tour.title,
          tour_code: tour.code,
          price_adult: 1500000,
          quantity_adult: 2,
          quantity: 2,
          subtotal: 3000000,
        },
      ],
      subtotal: 3000000,
      total_amount: 3000000,
      order_status: 'CONFIRMED',
      payment_status: 'PAID',
    });
    createdOrderId = order._id;

    // Access control checks
    const custADetail = await journeyService.getJourneyDetail(journey._id, customerA);
    assert(custADetail.journey._id.toString() === journey._id.toString(), 'Khách hàng A có đơn hợp lệ xem được hành trình');

    await expectError(
      () => journeyService.getJourneyDetail(journey._id, customerB),
      403,
      'Chặn Khách hàng B không có đơn xem hành trình'
    );

    await expectError(
      () => journeyService.startJourney(journey._id, guide2),
      403,
      'Chặn nhân viên chưa được phân công (Guide 2) bắt đầu hành trình'
    );

    // Start journey by assigned Guide 1
    const startRes = await journeyService.startJourney(journey._id, guide1, { version: journey.version });
    assert(startRes.journey.status === 'IN_PROGRESS', 'Bắt đầu hành trình -> IN_PROGRESS');
    assert(startRes.first_stop.status === 'TRAVELLING', 'Điểm đầu tiên tự động chuyển -> TRAVELLING');

    const stop1 = startRes.first_stop;
    const stop2 = stops[1];
    const stop3 = stops[2];

    // Cannot complete stop1 directly from TRAVELLING without arriving
    await expectError(
      () => journeyService.updateStopStatus(journey._id, stop1._id, guide1, { status: 'COMPLETED', version: stop1.version }),
      400,
      'Chặn hoàn thành điểm khi chưa xác nhận đến nơi (không bật ngoại lệ)'
    );

    // Stop 1: TRAVELLING -> VISITING -> COMPLETED
    const visit1 = await journeyService.updateStopStatus(journey._id, stop1._id, guide1, {
      status: 'VISITING',
      version: stop1.version,
    });
    assert(visit1.stop.status === 'VISITING' && !!visit1.stop.arrived_at, 'Xác nhận đến điểm 1 -> VISITING & lưu arrived_at');

    // Optimistic Concurrency Check with stale version
    await expectError(
      () =>
        journeyService.updateStopStatus(journey._id, stop1._id, guide1, {
          status: 'COMPLETED',
          version: stop1.version, // stale version!
        }),
      409,
      'Optimistic Concurrency Control: từ chối cập nhật với version cũ (409)'
    );

    // Complete journey blocked while stop 1 is VISITING
    await expectError(
      () => journeyService.completeJourney(journey._id, guide1),
      400,
      'Chặn kết thúc hành trình khi còn điểm đang VISITING'
    );

    const comp1 = await journeyService.updateStopStatus(journey._id, stop1._id, guide1, {
      status: 'COMPLETED',
      version: visit1.stop.version,
    });
    assert(comp1.stop.status === 'COMPLETED' && !!comp1.stop.completed_at, 'Hoàn thành điểm 1 & lưu completed_at');
    assert(comp1.progress === 33, `Tiến độ cập nhật chính xác (1/3 = 33%, got ${comp1.progress}%)`);

    // Skip Stop 2 without reason -> 400
    await expectError(
      () => journeyService.skipStop(journey._id, stop2._id, guide1, { reason: '' }),
      400,
      'Bắt buộc nhập lý do khi bỏ qua địa điểm'
    );

    // Skip Stop 2 with reason -> progress = 1 / (3 - 1) = 50%
    const skip2 = await journeyService.skipStop(journey._id, stop2._id, guide1, {
      reason: 'Trời mưa lớn khu vực hồ',
      version: stop2.version,
    });
    assert(skip2.stop.status === 'SKIPPED', 'Bỏ qua điểm 2 thành công');
    assert(skip2.progress === 50, `Tiến độ loại trừ điểm bỏ qua (1/2 = 50%, got ${skip2.progress}%)`);

    // Add extra stop with reason
    const addedRes = await journeyService.addStop(journey._id, guide1, {
      name: 'Điểm phát sinh: Quán cà phê view đồi',
      address: 'Đà Lạt',
      latitude: 11.95,
      longitude: 108.46,
      reason: 'Thay thế điểm hồ bị mưa',
    });
    assert(addedRes.stops.length === 4 && addedRes.stop.is_additional === true, 'Thêm điểm phát sinh thành công');
    assert(addedRes.progress === 33, `Tiến độ tính lại khi thêm điểm (1/3 = 33%, got ${addedRes.progress}%)`);

    // Reorder stops
    const currentStopIds = addedRes.stops.map((s) => s._id.toString());
    const swappedIds = [currentStopIds[0], currentStopIds[1], currentStopIds[3], currentStopIds[2]];
    const reorderRes = await journeyService.reorderStops(journey._id, guide1, {
      ordered_stop_ids: swappedIds,
      reason: 'Tối ưu cung đường di chuyển',
    });
    assert(reorderRes.stops[2]._id.toString() === addedRes.stop._id.toString(), 'Thay đổi thứ tự điểm dừng thành công');

    // Verify original Tour.itinerary was NOT mutated
    const tourAfter = await Tour.findById(tour._id).lean();
    assert(tourAfter.itinerary.length === 3, 'Không ghi đè lịch trình gốc của Tour');

    // Complete remaining stops (stop3 + added stop) using fresh versions after reorder
    const freshStop3 = reorderRes.stops.find((s) => s._id.toString() === stop3._id.toString());
    const freshAdded = reorderRes.stops.find((s) => s._id.toString() === addedRes.stop._id.toString());

    const trav3 = await journeyService.updateStopStatus(journey._id, freshStop3._id, guide1, {
      status: 'TRAVELLING',
      version: freshStop3.version,
    });
    const vis3 = await journeyService.updateStopStatus(journey._id, freshStop3._id, guide1, {
      status: 'VISITING',
      version: trav3.stop.version,
    });
    await journeyService.updateStopStatus(journey._id, freshStop3._id, guide1, {
      status: 'COMPLETED',
      version: vis3.stop.version,
    });

    // Complete added stop via exception flow (with mandatory reason)
    const compAdded = await journeyService.updateStopStatus(journey._id, freshAdded._id, guide1, {
      status: 'COMPLETED',
      is_exception: true,
      reason: 'Khách đã ghé xong, nhân viên xác nhận nhanh',
      version: freshAdded.version,
    });
    assert(compAdded.progress === 100, `Tiến độ đạt 100% khi xong toàn bộ điểm hợp lệ (got ${compAdded.progress}%)`);

    // Complete journey
    const compJourney = await journeyService.completeJourney(journey._id, guide1);
    assert(compJourney.journey.status === 'COMPLETED' && !!compJourney.journey.completed_at, 'Kết thúc hành trình thành công');

    // Admin logs verification
    const logsRes = await journeyAdminService.getJourneyLogs(journey._id);
    assert(logsRes.items.length >= 8, `Lưu vết đầy đủ lịch sử thao tác (${logsRes.items.length} logs)`);

    // Sync cancel on departure
    await journeyAdminService.syncCancelByDeparture(futureDep._id, adminUser._id, 'Đợt khởi hành bị hủy để test');
    const cancelledFuture = await TourJourney.findById(futureJourney._id).lean();
    assert(cancelledFuture.status === 'CANCELLED', 'Đồng bộ hủy hành trình khi TourDeparture bị hủy');

    console.log(`\n====================================================`);
    console.log(`📊 KẾT QUẢ: ${passed}/${total} TEST CASES PASSED`);
    console.log(`====================================================`);
  } catch (err) {
    console.error('Lỗi không mong muốn:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup test records
    if (createdJourneyIds.length > 0) {
      await JourneyLog.deleteMany({ journey_id: { $in: createdJourneyIds } });
      await JourneyStop.deleteMany({ journey_id: { $in: createdJourneyIds } });
      await JourneyNotification.deleteMany({ journey_id: { $in: createdJourneyIds } });
      await TourJourney.deleteMany({ _id: { $in: createdJourneyIds } });
    }
    if (createdOrderId) await Order.deleteOne({ _id: createdOrderId });
    if (createdDepIds.length > 0) await TourDeparture.deleteMany({ _id: { $in: createdDepIds } });
    if (createdTourId) await Tour.deleteOne({ _id: createdTourId });
    await User.deleteMany({ email: { $regex: `_${ts}@test\\.com$` } });
    await mongoose.disconnect();
    if (passed !== total) process.exit(1);
  }
}

runTests();
