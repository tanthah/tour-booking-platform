const mongoose = require('mongoose');

/**
 * Schema lưu bản ghi thông báo cho từng người nhận.
 * Cả Customer lẫn Employee/Admin đều dùng chung collection này,
 * phân biệt qua trường recipientType.
 */
const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Phân loại website nhận (customer hoặc admin)
    recipientType: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
      default: 'customer',
    },

    // Loại sự kiện – dùng để frontend render icon/màu phù hợp
    eventType: {
      type: String,
      required: true,
      enum: [
        // === CUSTOMER EVENTS ===
        'ORDER_CREATED',          // Đặt tour thành công
        'PAYMENT_SUCCESS',        // Thanh toán thành công
        'CANCEL_REQUESTED',       // Khách gửi yêu cầu hủy (xác nhận cho khách)
        'CANCEL_APPROVED',        // Yêu cầu hủy được duyệt
        'CANCEL_REJECTED',        // Yêu cầu hủy bị từ chối
        'REFUND_SUCCESS',         // Hoàn tiền thành công
        'DEPARTURE_CHANGED',      // Lịch khởi hành thay đổi
        'DEPARTURE_CANCELLED',    // Lịch khởi hành bị hủy
        'MEETING_POINT_CHANGED',  // Điểm tập trung thay đổi
        'CARD_PUBLISHED',         // Thiệp cá nhân được phát hành
        'PHOTO_ADDED',            // Ảnh hành trình được thêm (realtime-only)

        // === ADMIN EVENTS (để sau) ===
        'ADMIN_NEW_ORDER',
        'ADMIN_CANCEL_REQUEST',
        'ADMIN_CANCEL_PENDING_APPROVAL',
        'ADMIN_REFUND_FAILED',
        'ADMIN_DEPARTURE_ALERT',
        'ADMIN_NEW_EMPLOYEE',
        'ADMIN_PERMISSION_CHANGED',
        'ADMIN_ARTICLE_REVIEW',
        'ADMIN_ARTICLE_RESULT',
        'ADMIN_CARD_REVIEW',
        'ADMIN_CARD_RESULT',
      ],
    },

    // Tiêu đề ngắn hiển thị ở bell dropdown
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    // Nội dung chi tiết
    body: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // URL điều hướng khi người dùng click vào thông báo
    link: {
      type: String,
      default: null,
    },

    // Dữ liệu metadata tuỳ sự kiện (orderId, departureId, ...)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Trạng thái đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// Index phức hợp để query nhanh danh sách thông báo của 1 user
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
