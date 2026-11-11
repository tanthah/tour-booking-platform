/**
 * Test script cho Module TourDeparture (Lịch khởi hành)
 * Kiểm tra các yêu cầu nghiệp vụ:
 * 1. Chặn giảm total_slots < booked_slots + reserved_slots
 * 2. Đổi meeting_point_address bắt buộc phải có reason
 * 3. Ghi nhận DepartureChangeLog khi đổi meeting_point_address
 * 4. Truy vấn getChangeLogs trả về đầy đủ lịch sử
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('../src/config/env');
const Tour = require('../src/modules/tour/tour.model');
const TourDeparture = require('../src/modules/tour/tourDeparture.model');
const DepartureChangeLog = require('../src/modules/tour/departureChangeLog.model');
const tourDepartureService = require('../src/modules/tour/tourDeparture.service');
const User = require('../src/modules/user/user.model');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TOUR DEPARTURE');
  console.log('====================================================\n');

  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB.\n');

    // 1. Tạo mock admin user
    const adminUser = await User.findOneAndUpdate(
      { email: 'departure_tester@tourbooking.com' },
      {
        full_name: 'Admin Tester',
        email: 'departure_tester@tourbooking.com',
        phone: '0909999888',
        password_hash: 'mockhash',
        roles: ['ADMIN'],
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );

    // 2. Tạo mock tour
    const mockTour = await Tour.create({
      code: `DEP-TEST-${Date.now()}`,
      title: 'Tour Kiểm Thử Lịch Khởi Hành',
      category: 'DOMESTIC',
      destination_location: 'Đà Lạt',
      duration: '3 Ngày 2 Đêm',
      original_price: 2500000,
      sale_price: 2500000,
      main_image: 'https://example.com/test.jpg',
      status: 'ACTIVE',
    });

    // 3. Tạo departure
    const departure = await tourDepartureService.createDeparture(mockTour._id, {
      departure_date: new Date(Date.now() + 86400000 * 5),
      departure_location: 'TP. Hồ Chí Minh',
      vehicle: 'Xe 29 chỗ',
      total_slots: 20,
      meeting_point_address: 'Cột 12 Ga Quốc Nội Sân Bay Tân Sơn Nhất',
      meeting_time: '05:30',
    });

    assert(departure && departure.total_slots === 20, 'Tạo đợt khởi hành thành công với 20 chỗ');
    assert(departure.available_slots === 20, 'Số chỗ còn lại ban đầu = 20');

    // 4. Giả lập có 5 khách đã đặt
    departure.booked_slots = 5;
    await departure.save();

    // 5. TEST: Chặn giảm total_slots < booked_slots (5)
    let errorCaught = false;
    try {
      await tourDepartureService.updateDeparture(departure._id, { total_slots: 4 }, adminUser);
    } catch (err) {
      errorCaught = true;
      assert(
        err.message.includes('Tổng số chỗ không được nhỏ hơn'),
        `Chặn thành công giảm sức chứa dưới số khách đã đặt: "${err.message}"`
      );
    }
    assert(errorCaught, 'Throw lỗi khi giảm sức chứa dưới 5');

    // 6. TEST: Đổi địa điểm tập trung nhưng KHÔNG có lý do
    let reasonErrorCaught = false;
    try {
      await tourDepartureService.updateDeparture(
        departure._id,
        {
          meeting_point_address: 'Cổng D2 Sân Bay Tân Sơn Nhất',
          meeting_point_change_reason: '', // rỗng
        },
        adminUser
      );
    } catch (err) {
      reasonErrorCaught = true;
      assert(
        err.message.includes('Bắt buộc phải nhập lý do khi thay đổi địa điểm tập trung'),
        `Bắt lỗi thành công khi thiếu lý do: "${err.message}"`
      );
    }
    assert(reasonErrorCaught, 'Throw lỗi khi thiếu lý do thay đổi địa điểm');

    // 7. TEST: Đổi địa điểm tập trung CÓ lý do hợp lệ
    const updatedDep = await tourDepartureService.updateDeparture(
      departure._id,
      {
        meeting_point_address: 'Cổng D2 Sân Bay Tân Sơn Nhất',
        meeting_point_change_reason: 'Cột 12 đang thi công sửa chữa mặt bằng sảnh đón',
      },
      adminUser
    );

    assert(
      updatedDep.meeting_point_address === 'Cổng D2 Sân Bay Tân Sơn Nhất',
      'Cập nhật địa điểm mới thành công'
    );

    // 8. TEST: Kiểm tra DepartureChangeLog đã được ghi
    const logs = await tourDepartureService.getChangeLogs(departure._id);
    assert(logs.length === 1, `Tìm thấy 1 bản ghi DepartureChangeLog`);
    if (logs.length > 0) {
      assert(
        logs[0].old_value === 'Cột 12 Ga Quốc Nội Sân Bay Tân Sơn Nhất',
        `old_value lưu chính xác: "${logs[0].old_value}"`
      );
      assert(
        logs[0].new_value === 'Cổng D2 Sân Bay Tân Sơn Nhất',
        `new_value lưu chính xác: "${logs[0].new_value}"`
      );
      assert(
        logs[0].reason === 'Cột 12 đang thi công sửa chữa mặt bằng sảnh đón',
        `reason lưu chính xác: "${logs[0].reason}"`
      );
      assert(
        String(logs[0].changed_by?._id || logs[0].changed_by) === String(adminUser._id),
        'Người thực hiện được ghi nhận chính xác'
      );
    }

    // Dọn dẹp dữ liệu test
    await DepartureChangeLog.deleteMany({ departure_id: departure._id });
    await TourDeparture.deleteOne({ _id: departure._id });
    await Tour.deleteOne({ _id: mockTour._id });
    await User.deleteOne({ _id: adminUser._id });

    console.log('\n====================================================');
    console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Lỗi khi chạy test:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();

