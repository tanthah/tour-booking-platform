/**
 * Danh mục mã quyền (Permission Codes) tập trung cho toàn hệ thống
 */

const PERMISSIONS = {
  // Quản lý Tour
  TOUR_VIEW: 'tour.view',
  TOUR_CREATE: 'tour.create',
  TOUR_UPDATE: 'tour.update',
  TOUR_DELETE: 'tour.delete',

  // Quản lý Lịch khởi hành
  SCHEDULE_VIEW: 'schedule.view',
  SCHEDULE_CREATE: 'schedule.create',
  SCHEDULE_UPDATE: 'schedule.update',
  SCHEDULE_DELETE: 'schedule.delete',

  // Quản lý Danh mục Tour
  CATEGORY_MANAGE: 'category.manage',

  // Quản lý Đơn hàng
  BOOKING_VIEW: 'booking.view',
  BOOKING_MANAGE: 'booking.manage',

  // Quản lý Mã giảm giá (Coupon)
  COUPON_VIEW: 'coupon.view',
  COUPON_MANAGE: 'coupon.manage',

  // Tải lên tệp/ảnh
  UPLOAD_IMAGE: 'upload.image',

  // Quản lý Người dùng
  USER_VIEW: 'user.view',
  USER_MANAGE: 'user.manage',

  // Quản lý Vai trò & Phân quyền
  ROLE_MANAGE: 'role.manage',

  // Cài đặt hệ thống
  SETTINGS_MANAGE: 'settings.manage',

  // Xem lịch sử Audit Log
  AUDIT_VIEW: 'audit.view',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Nhóm các quyền theo module để hiển thị trên UI Admin
const PERMISSION_GROUPS = [
  {
    module: 'Tour',
    name: 'Quản lý Tour',
    permissions: [
      { code: PERMISSIONS.TOUR_VIEW, name: 'Xem danh sách & chi tiết Tour' },
      { code: PERMISSIONS.TOUR_CREATE, name: 'Tạo Tour mới' },
      { code: PERMISSIONS.TOUR_UPDATE, name: 'Cập nhật Tour & trạng thái' },
      { code: PERMISSIONS.TOUR_DELETE, name: 'Xóa Tour' },
    ],
  },
  {
    module: 'Schedule',
    name: 'Lịch khởi hành',
    permissions: [
      { code: PERMISSIONS.SCHEDULE_VIEW, name: 'Xem lịch khởi hành' },
      { code: PERMISSIONS.SCHEDULE_CREATE, name: 'Tạo đợt khởi hành' },
      { code: PERMISSIONS.SCHEDULE_UPDATE, name: 'Cập nhật lịch khởi hành' },
      { code: PERMISSIONS.SCHEDULE_DELETE, name: 'Xóa đợt khởi hành' },
    ],
  },
  {
    module: 'Category',
    name: 'Danh mục Tour',
    permissions: [
      { code: PERMISSIONS.CATEGORY_MANAGE, name: 'Toàn quyền danh mục (Xem, tạo, sửa, xóa)' },
    ],
  },
  {
    module: 'Booking',
    name: 'Đơn hàng (Booking)',
    permissions: [
      { code: PERMISSIONS.BOOKING_VIEW, name: 'Xem danh sách & chi tiết đơn hàng' },
      { code: PERMISSIONS.BOOKING_MANAGE, name: 'Cập nhật trạng thái đơn hàng & thanh toán' },
    ],
  },
  {
    module: 'Coupon',
    name: 'Mã giảm giá',
    permissions: [
      { code: PERMISSIONS.COUPON_VIEW, name: 'Xem danh sách coupon & báo cáo' },
      { code: PERMISSIONS.COUPON_MANAGE, name: 'Tạo, sửa, xóa, phát hành lô coupon' },
    ],
  },
  {
    module: 'Media',
    name: 'Tải lên hình ảnh',
    permissions: [
      { code: PERMISSIONS.UPLOAD_IMAGE, name: 'Tải lên hình ảnh tour/tin tức' },
    ],
  },
  {
    module: 'User',
    name: 'Người dùng',
    permissions: [
      { code: PERMISSIONS.USER_VIEW, name: 'Xem danh sách & chi tiết người dùng' },
      { code: PERMISSIONS.USER_MANAGE, name: 'Khóa / mở khóa tài khoản người dùng' },
    ],
  },
  {
    module: 'Role',
    name: 'Vai trò & Phân quyền',
    permissions: [
      { code: PERMISSIONS.ROLE_MANAGE, name: 'Quản lý Role & gán Permission Override' },
    ],
  },
  {
    module: 'Settings',
    name: 'Cài đặt hệ thống',
    permissions: [
      { code: PERMISSIONS.SETTINGS_MANAGE, name: 'Thay đổi cấu hình hệ thống chung' },
    ],
  },
  {
    module: 'Audit',
    name: 'Nhật ký hệ thống (Audit Log)',
    permissions: [
      { code: PERMISSIONS.AUDIT_VIEW, name: 'Xem lịch sử thay đổi quyền & trạng thái' },
    ],
  },
];

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
};
