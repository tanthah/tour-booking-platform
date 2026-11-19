/**
 * Script tạo tài khoản Admin và khởi tạo các vai trò (Roles) mặc định cho hệ thống
 * Chạy bằng lệnh: node createAdmin.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./src/modules/user/user.model');
const Role = require('./src/modules/role/role.model');
const { MONGO_URI } = require('./src/config/env');
const { PERMISSIONS, ALL_PERMISSIONS } = require('./src/utils/permissionCodes');

// Thông tin tài khoản Admin - lấy từ .env hoặc dùng giá trị mặc định
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tourbooking.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'Quan Tri Vien';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '0900000001';

/**
 * Khởi tạo hoặc cập nhật các vai trò hệ thống mặc định
 */
const ensureDefaultRoles = async () => {
  const defaultRoles = [
    {
      code: 'admin',
      name: 'Quản trị viên',
      description: 'Toàn quyền quản trị hệ thống',
      is_system: true,
      is_active: true,
      permissions: ALL_PERMISSIONS,
    },
    {
      code: 'customer',
      name: 'Khách hàng',
      description: 'Người dùng mua tour và dịch vụ',
      is_system: true,
      is_active: true,
      permissions: [],
    },
    {
      code: 'tour_staff',
      name: 'Nhân viên tour',
      description: 'Điều hành tour, lịch trình và thiệp kỷ niệm',
      is_system: true,
      is_active: true,
      permissions: [
        PERMISSIONS.TOUR_VIEW,
        PERMISSIONS.TOUR_UPDATE,
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.SCHEDULE_CREATE,
        PERMISSIONS.SCHEDULE_UPDATE,
        PERMISSIONS.JOURNEY_VIEW,
        PERMISSIONS.JOURNEY_MANAGE,
        PERMISSIONS.SOUVENIR_ALBUM_VIEW,
        PERMISSIONS.SOUVENIR_ALBUM_CREATE,
        PERMISSIONS.SOUVENIR_ALBUM_UPDATE,
        PERMISSIONS.SOUVENIR_PHOTO_UPLOAD,
        PERMISSIONS.SOUVENIR_PHOTO_DELETE,
        PERMISSIONS.SOUVENIR_PHOTO_ASSIGN,
        PERMISSIONS.SOUVENIR_CARD_VIEW,
        PERMISSIONS.SOUVENIR_CARD_CREATE,
        PERMISSIONS.SOUVENIR_CARD_UPDATE,
        PERMISSIONS.SOUVENIR_CARD_PREVIEW,
        PERMISSIONS.SOUVENIR_CARD_SUBMIT_REVIEW,
      ],
    },
    {
      code: 'booking_staff',
      name: 'Nhân viên đặt chỗ',
      description: 'Quản lý đơn hàng và mã giảm giá',
      is_system: true,
      is_active: true,
      permissions: [
        PERMISSIONS.BOOKING_VIEW,
        PERMISSIONS.BOOKING_MANAGE,
        PERMISSIONS.COUPON_VIEW,
        PERMISSIONS.COUPON_MANAGE,
        PERMISSIONS.USER_VIEW,
      ],
    },
  ];

  let adminRole = null;

  for (const r of defaultRoles) {
    let role = await Role.findOne({ code: r.code });
    if (!role) {
      role = await Role.create(r);
      console.log(`- Đã khởi tạo vai trò mặc định: [${r.code}] - ${r.name}`);
    } else {
      // Cập nhật lại quyền nếu là role admin
      if (r.code === 'admin') {
        role.permissions = ALL_PERMISSIONS;
        role.is_active = true;
        await role.save();
      }
    }
    if (r.code === 'admin') {
      adminRole = role;
    }
  }

  return adminRole;
};

const createAdmin = async () => {
  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour_booking_db';
    await mongoose.connect(dbUri);
    console.log('✅ Kết nối MongoDB thành công');

    // 1. Đảm bảo các vai trò hệ thống đã tồn tại
    console.log('\n--- Kiểm tra và khởi tạo vai trò hệ thống ---');
    const adminRole = await ensureDefaultRoles();

    // 2. Tìm hoặc tạo tài khoản Admin
    console.log('\n--- Khởi tạo tài khoản Quản Trị Viên ---');
    let existing = await User.findOne({ email: ADMIN_EMAIL, deleted_at: null });

    if (existing) {
      console.log(`ℹ️ Tài khoản ${ADMIN_EMAIL} đã tồn tại trong cơ sở dữ liệu.`);

      existing.full_name = ADMIN_FULLNAME;
      existing.phone = ADMIN_PHONE;
      existing.roles = ['ADMIN'];
      existing.role_id = adminRole._id;
      existing.status = 'ACTIVE';
      existing.password_hash = ADMIN_PASSWORD; // Pre-save hook sẽ tự động băm lại mật khẩu

      await existing.save();
      console.log(`✅ Đã đồng bộ vai trò ADMIN, role_id và đặt lại mật khẩu cho tài khoản: ${ADMIN_EMAIL}`);
    } else {
      const admin = new User({
        full_name: ADMIN_FULLNAME,
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE,
        password_hash: ADMIN_PASSWORD,
        roles: ['ADMIN'],
        role_id: adminRole._id,
        status: 'ACTIVE',
      });

      await admin.save();
      console.log(`🎉 Tạo tài khoản Admin mới thành công!`);
    }

    console.log('\n====================================================');
    console.log('🔑 THÔNG TIN ĐĂNG NHẬP ADMIN:');
    console.log('Email   : ' + ADMIN_EMAIL);
    console.log('Mật khẩu: ' + ADMIN_PASSWORD);
    console.log('Vai trò : ADMIN (Role: admin - Toàn bộ quyền hệ thống)');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo tài khoản Admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
