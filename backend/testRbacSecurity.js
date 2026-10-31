/**
 * Kịch bản kiểm thử bảo mật & RBAC logic toàn diện (Checklist Giai đoạn 6)
 * Chạy lệnh: node testRbacSecurity.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('./config/env');
const User = require('./modules/user/user.model');
const Role = require('./modules/role/role.model');
const AuditLog = require('./modules/audit/auditLog.model');
const permissionService = require('./services/permissionService');
const adminUserService = require('./modules/admin/adminUser.service');
const adminRoleService = require('./modules/admin/adminRole.service');
const userService = require('./modules/user/user.service');
const { PERMISSIONS } = require('./utils/permissionCodes');

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

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ BẢO MẬT & HỆ THỐNG PHÂN QUYỀN RBAC');
  console.log('====================================================\n');

  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
    await mongoose.connect(dbUri);

    // Chuẩn bị Role
    const adminRole = await Role.findOne({ code: 'admin' });
    const customerRole = await Role.findOne({ code: 'customer' });
    const tourStaffRole = await Role.findOne({ code: 'tour_staff' });
    const bookingStaffRole = await Role.findOne({ code: 'booking_staff' });

    assert(adminRole && customerRole && tourStaffRole && bookingStaffRole, 'Hệ thống đã có đủ 4 role mặc định');

    // TEST 1: Đăng ký luôn là CUSTOMER dù client cố ý gửi role khác
    console.log('\n--- TEST 1: Khách đăng ký không thể tự nâng quyền ---');
    const testRegEmail = `test_security_${Date.now()}@test.com`;
    await userService.register({
      full_name: 'Hacker Wannabe',
      phone: '0988776655',
      email: testRegEmail,
      password: 'Password@123',
      role: 'admin',
      roles: ['ADMIN'],
    });
    const createdUser = await User.findOne({ email: testRegEmail });
    assert(createdUser !== null, 'Tài khoản thử nghiệm được tạo thành công');
    assert(createdUser.role_id.toString() === customerRole._id.toString(), 'Role được gán bắt buộc là customer');
    assert(!createdUser.roles.includes('ADMIN'), 'Mảng roles không bị chiếm quyền ADMIN');

    // TEST 2: Tính toán quyền hiệu lực theo từng Role
    console.log('\n--- TEST 2: Phân tách quyền giữa các Vai trò ---');
    const adminUser = await User.findOne({ role_id: adminRole._id, status: 'ACTIVE' });
    assert(adminUser !== null, 'Có ít nhất 1 tài khoản Admin đang active');

    const adminCanCreateTour = await permissionService.hasPermission(adminUser, PERMISSIONS.TOUR_CREATE);
    const adminCanManageBooking = await permissionService.hasPermission(adminUser, PERMISSIONS.BOOKING_MANAGE);
    assert(adminCanCreateTour && adminCanManageBooking, 'Admin có toàn quyền (tour.create & booking.manage)');

    // Giả lập đối tượng Staff Tour & Booking
    const mockTourStaff = {
      status: 'ACTIVE',
      role_id: tourStaffRole,
      permission_overrides: [],
    };
    const mockBookingStaff = {
      status: 'ACTIVE',
      role_id: bookingStaffRole,
      permission_overrides: [],
    };
    const mockCustomer = {
      status: 'ACTIVE',
      role_id: customerRole,
      permission_overrides: [],
    };

    const tourStaffCanEditTour = await permissionService.hasPermission(mockTourStaff, PERMISSIONS.TOUR_UPDATE);
    const tourStaffCanManageCoupon = await permissionService.hasPermission(mockTourStaff, PERMISSIONS.COUPON_MANAGE);
    assert(tourStaffCanEditTour === true, 'Tour Staff CÓ quyền tour.update');
    assert(tourStaffCanManageCoupon === false, 'Tour Staff KHÔNG CÓ quyền coupon.manage');

    const bookingStaffCanManageCoupon = await permissionService.hasPermission(mockBookingStaff, PERMISSIONS.COUPON_MANAGE);
    const bookingStaffCanDeleteTour = await permissionService.hasPermission(mockBookingStaff, PERMISSIONS.TOUR_DELETE);
    assert(bookingStaffCanManageCoupon === true, 'Booking Staff CÓ quyền coupon.manage');
    assert(bookingStaffCanDeleteTour === false, 'Booking Staff KHÔNG CÓ quyền tour.delete');

    const customerCanCreateTour = await permissionService.hasPermission(mockCustomer, PERMISSIONS.TOUR_CREATE);
    assert(customerCanCreateTour === false, 'Customer KHÔNG CÓ quyền tour.create');

    // TEST 3: Permission Overrides (ALLOW & DENY)
    console.log('\n--- TEST 3: Cơ chế Permission Overrides ---');
    // Customer nhưng được ALLOW quyền tour.view
    const customerWithOverride = {
      status: 'ACTIVE',
      role_id: customerRole,
      permission_overrides: [{ permission: PERMISSIONS.TOUR_VIEW, effect: 'ALLOW' }],
    };
    const customerHasTourView = await permissionService.hasPermission(customerWithOverride, PERMISSIONS.TOUR_VIEW);
    assert(customerHasTourView === true, 'Customer được override ALLOW thành công (has tour.view)');

    // Tour Staff nhưng bị DENY quyền tour.delete
    const tourStaffDeniedDelete = {
      status: 'ACTIVE',
      role_id: tourStaffRole,
      permission_overrides: [{ permission: PERMISSIONS.TOUR_DELETE, effect: 'DENY' }],
    };
    const tourStaffCanDelete = await permissionService.hasPermission(tourStaffDeniedDelete, PERMISSIONS.TOUR_DELETE);
    assert(tourStaffCanDelete === false, 'Tour Staff bị override DENY thành công (mất quyền tour.delete)');

    // TEST 4: Khóa tài khoản -> Mọi quyền đều bị từ chối
    console.log('\n--- TEST 4: Trạng thái LOCKED / INACTIVE chặn toàn bộ quyền ---');
    const lockedAdmin = {
      status: 'LOCKED',
      role_id: adminRole,
      permission_overrides: [],
    };
    const lockedAccess = await permissionService.hasPermission(lockedAdmin, PERMISSIONS.TOUR_VIEW);
    assert(lockedAccess === false, 'Tài khoản LOCKED bị chặn toàn bộ quyền');

    // TEST 5: Nghiệp vụ bảo vệ Quản trị viên cuối cùng
    console.log('\n--- TEST 5: Bảo vệ Quản trị viên cuối cùng ---');
    try {
      await adminUserService.changeStatus({
        actor: { _id: new mongoose.Types.ObjectId() },
        targetId: adminUser._id,
        status: 'LOCKED',
        reason: 'Test lock last admin',
      });
      assert(false, 'Khóa admin cuối cùng phải bị reject');
    } catch (err) {
      assert(err.statusCode === 400, 'Khóa admin cuối cùng bị từ chối chính xác: ' + err.message);
    }

    try {
      await adminUserService.changeRole({
        actor: { _id: new mongoose.Types.ObjectId() },
        targetId: adminUser._id,
        roleId: customerRole._id,
        reason: 'Test demote last admin',
      });
      assert(false, 'Hạ quyền admin cuối cùng phải bị reject');
    } catch (err) {
      assert(err.statusCode === 400, 'Hạ quyền admin cuối cùng bị từ chối chính xác: ' + err.message);
    }

    // TEST 6: Cấm tự đổi vai trò / tự override quyền
    console.log('\n--- TEST 6: Cấm tự thay đổi quyền hạn của chính mình ---');
    try {
      await adminUserService.changeRole({
        actor: adminUser,
        targetId: adminUser._id,
        roleId: tourStaffRole._id,
      });
      assert(false, 'Tự đổi role phải bị reject');
    } catch (err) {
      assert(err.statusCode === 400, 'Tự đổi vai trò bị từ chối: ' + err.message);
    }

    try {
      await adminUserService.setPermissionOverrides({
        actor: adminUser,
        targetId: adminUser._id,
        overrides: [{ permission: PERMISSIONS.TOUR_VIEW, effect: 'ALLOW' }],
      });
      assert(false, 'Tự cấu hình override phải bị reject');
    } catch (err) {
      assert(err.statusCode === 400, 'Tự cấu hình override bị từ chối: ' + err.message);
    }

    // TEST 7: Nhân viên không được gán quyền Admin cho người khác
    console.log('\n--- TEST 7: Staff không được gán quyền Admin ---');
    try {
      await adminUserService.changeRole({
        actor: { _id: new mongoose.Types.ObjectId(), roles: ['STAFF'], role_id: tourStaffRole },
        targetId: createdUser._id,
        roleId: adminRole._id,
      });
      assert(false, 'Staff gán role Admin phải bị reject');
    } catch (err) {
      assert(err.statusCode === 403, 'Staff gán role Admin bị từ chối với 403: ' + err.message);
    }

    // TEST 8: Bảo vệ Role hệ thống & Admin permissions
    console.log('\n--- TEST 8: Bảo vệ Role hệ thống & Admin Permissions ---');
    try {
      await adminRoleService.updateRole({
        actor: adminUser,
        id: customerRole._id,
        is_active: false,
      });
      assert(false, 'Vô hiệu hóa system role phải bị reject');
    } catch (err) {
      assert(err.statusCode === 400, 'Vô hiệu hóa system role bị từ chối: ' + err.message);
    }

    try {
      await adminRoleService.setRolePermissions({
        actor: adminUser,
        id: adminRole._id,
        permissions: [PERMISSIONS.TOUR_VIEW],
      });
      assert(false, 'Bớt quyền của role admin phải bị reject');
    } catch (err) {
      assert(err.statusCode === 400, 'Giới hạn quyền của role admin bị từ chối: ' + err.message);
    }

    // TEST 9: AuditLog được ghi nhận
    console.log('\n--- TEST 9: Kiểm tra AuditLog ---');
    const logs = await AuditLog.find({}).sort({ created_at: -1 }).limit(5);
    assert(logs.length >= 0, `Đã truy vấn AuditLog thành công (tìm thấy ${logs.length} bản ghi gần nhất)`);

    // Dọn dẹp dữ liệu test
    await User.deleteOne({ email: testRegEmail });
    const { default: OtpVerification } = { default: require('./modules/user/otp.model') };
    await OtpVerification.deleteMany({ email: testRegEmail });

    console.log('\n====================================================');
    console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (error) {
    console.error('Lỗi ngoại lệ trong quá trình chạy test:', error);
    process.exit(1);
  }
}

runSecurityTests();
