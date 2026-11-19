const mongoose = require('mongoose');

/**
 * Coupon Schema — Mã giảm giá theo phần trăm
 * Trạng thái lưu: ACTIVE hoặc INACTIVE. Hết hạn suy ra từ now > end_at.
 * used_count được cập nhật nguyên tử (atomic update) để chống race condition.
 */
const couponSchema = new mongoose.Schema(
  {
    // Mã coupon — duy nhất, chuẩn hóa chữ hoa
    code: {
      type: String,
      required: [true, 'Mã coupon là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [50, 'Mã coupon không quá 50 ký tự'],
    },
    // Mô tả ngắn cho khách hàng
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Mô tả không quá 500 ký tự'],
    },
    // Phần trăm giảm giá (1 - 100)
    discount_percent: {
      type: Number,
      required: [true, 'Phần trăm giảm giá là bắt buộc'],
      min: [1, 'Phần trăm giảm phải >= 1'],
      max: [100, 'Phần trăm giảm phải <= 100'],
    },
    // Mức giảm tối đa (VNĐ). null = không giới hạn
    max_discount_amount: {
      type: Number,
      default: null,
      min: [0, 'Mức giảm tối đa phải >= 0'],
    },
    // Đơn hàng tối thiểu để áp dụng (VNĐ). null = không yêu cầu
    min_order_amount: {
      type: Number,
      default: null,
      min: [0, 'Đơn tối thiểu phải >= 0'],
    },
    // Tổng lượt sử dụng tối đa. null = không giới hạn
    usage_limit: {
      type: Number,
      default: null,
      min: [1, 'Tổng lượt dùng phải >= 1'],
    },
    // Số lượt đã sử dụng — cập nhật nguyên tử, không sửa trực tiếp
    used_count: {
      type: Number,
      default: 0,
      min: [0, 'Số lượt đã dùng phải >= 0'],
    },
    // Giới hạn lượt dùng cho mỗi khách hàng
    per_user_limit: {
      type: Number,
      default: 1,
      min: [1, 'Giới hạn mỗi khách phải >= 1'],
    },
    // Thời gian hiệu lực
    start_at: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc'],
    },
    end_at: {
      type: Date,
      required: [true, 'Ngày kết thúc là bắt buộc'],
    },
    // Trạng thái. Không lưu EXPIRED — suy ra từ now > end_at
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    // Đối tượng khách hàng: ALL hoặc NEW_USER (chào mừng khách mới)
    user_target: {
      type: String,
      enum: ['ALL', 'NEW_USER'],
      default: 'ALL',
    },
    // Phạm vi áp dụng: ALL | CATEGORY | SEASON | SPECIFIC_TOURS
    applies_to: {
      type: String,
      enum: ['ALL', 'CATEGORY', 'SEASON', 'SPECIFIC_TOURS'],
      default: 'ALL',
    },
    // Danh mục tour áp dụng (DOMESTIC / INTERNATIONAL)
    applicable_categories: {
      type: [String],
      default: [],
    },
    // Mùa du lịch áp dụng (SPRING, SUMMER, AUTUMN, WINTER)
    applicable_seasons: {
      type: [String],
      default: [],
    },
    // Danh sách tour cụ thể được áp dụng
    applicable_tour_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
    ],
    // Hỗ trợ phát hành mã theo lô (batch)
    is_batch: {
      type: Boolean,
      default: false,
    },
    batch_id: {
      type: String,
      default: null,
    },
    // Người tạo (Admin/Staff)
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Xóa mềm
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// ========== INDEX ==========
couponSchema.index({ status: 1, start_at: 1, end_at: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

// =========================================================================

/**
 * CouponUsage Schema — Ghi nhận lượt sử dụng coupon cho từng booking
 * Trạng thái: RESERVED (giữ lượt khi tạo đơn) → USED (thanh toán xong)
 *             hoặc → RELEASED (đơn hết hạn / hủy)
 */
const couponUsageSchema = new mongoose.Schema(
  {
    coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: [true, 'Coupon ID là bắt buộc'],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Booking ID là bắt buộc'],
    },
    // Số tiền giảm thực tế đã chốt tại thời điểm đặt
    discount_amount: {
      type: Number,
      required: [true, 'Số tiền giảm là bắt buộc'],
      min: [0, 'Số tiền giảm phải >= 0'],
    },
    status: {
      type: String,
      enum: ['RESERVED', 'USED', 'RELEASED'],
      default: 'RESERVED',
    },
    used_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// ========== INDEX ==========
couponUsageSchema.index({ coupon_id: 1, user_id: 1, status: 1 });
couponUsageSchema.index({ booking_id: 1 });

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

module.exports = { Coupon, CouponUsage };
