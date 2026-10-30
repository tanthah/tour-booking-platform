const mongoose = require('mongoose');

/**
 * OrderLog Schema — Nhật ký xử lý đơn hàng
 * Ghi lại toàn bộ hành động: ai làm, lúc nào, thay đổi gì
 */
const orderLogSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    // Người thực hiện hành động
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = hệ thống tự động
    },
    // Loại hành động
    action: {
      type: String,
      enum: [
        'CREATED',               // Tạo đơn
        'DEPOSIT_PAID',          // Thanh toán cọc 30%
        'FULL_PAID',             // Thanh toán đủ 100%
        'STATUS_CHANGED',        // Chuyển trạng thái
        'CANCEL_REQUESTED',      // Yêu cầu hủy
        'CANCEL_APPROVED',       // Duyệt hủy
        'COMPANY_CANCELLED',     // Công ty hủy tour
        'REFUND_CREATED',        // Tạo yêu cầu hoàn tiền
        'REFUND_PROCESSING',     // Đang xử lý hoàn tiền
        'REFUND_COMPLETED',      // Hoàn tiền thành công
        'REFUND_FAILED',         // Hoàn tiền thất bại
        'OVERDUE_FLAGGED',       // Đánh dấu quá hạn
        'STAFF_NOTE',            // Ghi chú nội bộ nhân viên
      ],
      required: true,
    },
    // Mô tả chi tiết hành động
    description: { type: String, default: '' },
    // Dữ liệu thay đổi (before/after) dạng JSON
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

orderLogSchema.index({ order_id: 1, created_at: -1 });

const OrderLog = mongoose.model('OrderLog', orderLogSchema);
module.exports = OrderLog;

