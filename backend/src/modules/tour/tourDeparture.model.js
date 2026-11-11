const mongoose = require('mongoose');

/**
 * TourDeparture Schema — Quản lý lịch khởi hành của Tour
 * Theo yêu cầu mới (v2):
 * - Quản lý ngày giờ bắt đầu tour (start_datetime) và địa điểm tập trung (meeting_point)
 * - Quản lý sức chứa tour (total_slots, booked_slots, reserved_slots, available_slots)
 * - Đã loại bỏ: điểm xuất phát (departure_location), phương tiện (vehicle), điểm kết thúc (end_location), v.v.
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
    // Ngày giờ tour bắt đầu (thống nhất múi giờ Asia/Ho_Chi_Minh, lưu chuẩn UTC ISO Date)
    start_datetime: {
      type: Date,
      required: [true, 'Ngày và giờ tour bắt đầu là bắt buộc'],
    },
    // Địa điểm tập trung của đoàn
    meeting_point: {
      type: String,
      required: [true, 'Địa điểm tập trung là bắt buộc'],
      trim: true,
    },
    // ========== QUẢN LÝ SỨC CHỨA CỐ ĐỊNH ==========
    // Tổng số khách tối đa cho đợt do admin sắp xếp
    total_slots: {
      type: Number,
      required: [true, 'Tổng số chỗ là bắt buộc'],
      min: [1, 'Tổng số chỗ phải >= 1'],
    },
    // Số chỗ đã đặt (đã thanh toán hoặc xác nhận)
    booked_slots: {
      type: Number,
      default: 0,
      min: [0, 'Số chỗ đã đặt phải >= 0'],
    },
    // Số chỗ đang giữ tạm (chờ thanh toán)
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

// ========== VIRTUALS ==========
// Số chỗ còn lại
tourDepartureSchema.virtual('available_slots').get(function () {
  return (this.total_slots || 0) - (this.booked_slots || 0) - (this.reserved_slots || 0);
});

// Alias tương thích ngược
tourDepartureSchema.virtual('tour_id').get(function () {
  return this.product_id;
});

tourDepartureSchema.virtual('departure_date').get(function () {
  return this.start_datetime;
});

tourDepartureSchema.virtual('meeting_point_address').get(function () {
  return this.meeting_point;
});

// ========== INDEXES ==========
tourDepartureSchema.index({ product_id: 1, start_datetime: 1 });
tourDepartureSchema.index({ status: 1 });
tourDepartureSchema.index({ deleted_at: 1 });
tourDepartureSchema.index({ start_datetime: 1 });

const TourDeparture = mongoose.model('TourDeparture', tourDepartureSchema);

module.exports = TourDeparture;
