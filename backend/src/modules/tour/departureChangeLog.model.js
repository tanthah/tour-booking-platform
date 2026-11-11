const mongoose = require('mongoose');

/**
 * DepartureChangeLog Schema — Lưu lịch sử thay đổi thông tin đợt khởi hành
 * Bắt buộc ghi lại khi thay đổi địa điểm tập trung (meeting_point_address) kèm lý do
 * Hỗ trợ mở rộng cho các trường khác trong tương lai
 */
const departureChangeLogSchema = new mongoose.Schema(
  {
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourDeparture',
      required: [true, 'departure_id là bắt buộc'],
      index: true,
    },
    // Tên trường thay đổi (VD: "meeting_point")
    field: {
      type: String,
      required: [true, 'Tên trường thay đổi là bắt buộc'],
      default: 'meeting_point',
    },
    // Giá trị trước khi thay đổi
    old_value: {
      type: String,
      default: '',
    },
    // Giá trị mới sau khi thay đổi
    new_value: {
      type: String,
      required: [true, 'Giá trị mới là bắt buộc'],
    },
    // Lý do thay đổi (Admin bắt buộc nhập)
    reason: {
      type: String,
      required: [true, 'Lý do thay đổi là bắt buộc'],
      trim: true,
    },
    // Người thực hiện thay đổi (Admin/Staff)
    changed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Thời điểm thay đổi
    changed_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

departureChangeLogSchema.index({ departure_id: 1, changed_at: -1 });

const DepartureChangeLog = mongoose.model('DepartureChangeLog', departureChangeLogSchema);

module.exports = DepartureChangeLog;

