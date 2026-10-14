const mongoose = require('mongoose');

/**
 * TourDeparture Schema — Quản lý đợt khởi hành của Tour
 * Quan hệ: N đợt thuộc 1 Tour (product_id → Tour)
 * Giá dùng chung từ Tour; sức chứa quản lý riêng từng đợt
 * Trạng thái: OPEN → FULL / CLOSED / CANCELLED
 */
const tourDepartureSchema = new mongoose.Schema(
  {
    // Tham chiếu đến Tour cha
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour ID là bắt buộc'],
      index: true,
    },
    // Ngày giờ khởi hành (lưu UTC, hiển thị theo Asia/Ho_Chi_Minh)
    departure_date: {
      type: Date,
      required: [true, 'Ngày khởi hành là bắt buộc'],
    },
    // Điểm khởi hành (VD: TP.HCM, Hà Nội)
    departure_location: {
      type: String,
      required: [true, 'Điểm khởi hành là bắt buộc'],
      trim: true,
    },
    // Phương tiện di chuyển
    vehicle: {
      type: String,
      required: [true, 'Phương tiện là bắt buộc'],
      default: 'Ô tô 45 chỗ',
    },
    // ========== SỨC CHỨA ==========
    // Tổng số chỗ ban đầu — Admin nhập khi tạo đợt
    total_slots: {
      type: Number,
      required: [true, 'Tổng số chỗ là bắt buộc'],
      min: [1, 'Tổng số chỗ phải >= 1'],
    },
    // Số chỗ đã xác nhận — Hệ thống cập nhật từ Booking
    booked_slots: {
      type: Number,
      default: 0,
      min: [0, 'Số chỗ đã đặt phải >= 0'],
    },
    // Số chỗ đang giữ tạm — Dùng cho đơn chờ thanh toán
    reserved_slots: {
      type: Number,
      default: 0,
      min: [0, 'Số chỗ giữ tạm phải >= 0'],
    },
    // ========== TRẠNG THÁI ==========
    status: {
      type: String,
      enum: ['OPEN', 'FULL', 'CLOSED', 'CANCELLED'],
      default: 'OPEN',
    },
    // Xóa mềm
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== VIRTUAL: Số chỗ còn lại ==========
// Lưu ý: Virtual không dùng được trong truy vấn MongoDB filter/sort
tourDepartureSchema.virtual('available_slots').get(function () {
  return this.total_slots - this.booked_slots - this.reserved_slots;
});

// ========== INDEX ==========
tourDepartureSchema.index({ product_id: 1, departure_date: 1 });
tourDepartureSchema.index({ status: 1 });
tourDepartureSchema.index({ deleted_at: 1 });
tourDepartureSchema.index({ departure_date: 1 });

const TourDeparture = mongoose.model('TourDeparture', tourDepartureSchema);

module.exports = TourDeparture;
