/**
 * Danh sách hằng số eventType của module Notification.
 * Import file này thay vì hardcode string ở các module nghiệp vụ.
 */

const NOTIFICATION_EVENTS = {
  // ============================================================
  // CUSTOMER EVENTS
  // ============================================================

  /** Đặt tour thành công */
  ORDER_CREATED: 'ORDER_CREATED',

  /** Thanh toán thành công */
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',

  /** Khách gửi yêu cầu hủy – xác nhận hệ thống đã nhận */
  CANCEL_REQUESTED: 'CANCEL_REQUESTED',

  /** Yêu cầu hủy tour được Admin duyệt */
  CANCEL_APPROVED: 'CANCEL_APPROVED',

  /** Yêu cầu hủy tour bị Admin từ chối */
  CANCEL_REJECTED: 'CANCEL_REJECTED',

  /** Hoàn tiền thành công */
  REFUND_SUCCESS: 'REFUND_SUCCESS',

  /** Lịch khởi hành bị thay đổi (ngày, địa điểm xuất phát…) */
  DEPARTURE_CHANGED: 'DEPARTURE_CHANGED',

  /** Lịch khởi hành bị hủy */
  DEPARTURE_CANCELLED: 'DEPARTURE_CANCELLED',

  /** Điểm tập trung được cập nhật */
  MEETING_POINT_CHANGED: 'MEETING_POINT_CHANGED',

  /** Thiệp điện tử cá nhân được phát hành */
  CARD_PUBLISHED: 'CARD_PUBLISHED',

  /** Ảnh hành trình được thêm (realtime-only, không lưu bell) */
  PHOTO_ADDED: 'PHOTO_ADDED',

  // ============================================================
  // ADMIN EVENTS (dùng sau)
  // ============================================================
  ADMIN_NEW_ORDER: 'ADMIN_NEW_ORDER',
  ADMIN_CANCEL_REQUEST: 'ADMIN_CANCEL_REQUEST',
  ADMIN_CANCEL_PENDING_APPROVAL: 'ADMIN_CANCEL_PENDING_APPROVAL',
  ADMIN_REFUND_FAILED: 'ADMIN_REFUND_FAILED',
  ADMIN_DEPARTURE_ALERT: 'ADMIN_DEPARTURE_ALERT',
  ADMIN_NEW_EMPLOYEE: 'ADMIN_NEW_EMPLOYEE',
  ADMIN_PERMISSION_CHANGED: 'ADMIN_PERMISSION_CHANGED',
  ADMIN_ARTICLE_REVIEW: 'ADMIN_ARTICLE_REVIEW',
  ADMIN_ARTICLE_RESULT: 'ADMIN_ARTICLE_RESULT',
  ADMIN_CARD_REVIEW: 'ADMIN_CARD_REVIEW',
  ADMIN_CARD_RESULT: 'ADMIN_CARD_RESULT',
};

module.exports = NOTIFICATION_EVENTS;
