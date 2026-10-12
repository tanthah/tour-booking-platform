const mongoose = require('mongoose');

/**
 * Tour Schema — Quản lý dữ liệu Tour du lịch trong MongoDB
 * Trạng thái vòng đời: DRAFT -> PUBLISHED -> FULL / CLOSED / CANCELLED
 */
const tourSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã Tour là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Tên Tour là bắt buộc'],
      trim: true,
      maxlength: [255, 'Tên Tour không được quá 255 ký tự'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Mô tả ngắn không được quá 1000 ký tự'],
      default: '',
    },
    category: {
      type: String,
      enum: ['DOMESTIC', 'INTERNATIONAL'],
      required: [true, 'Phân loại Tour là bắt buộc (DOMESTIC hoặc INTERNATIONAL)'],
    },
    region: {
      type: String,
      enum: ['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'],
      default: 'MIEN_BAC',
    },
    departure_location: {
      type: String,
      required: [true, 'Điểm khởi hành là bắt buộc'],
      trim: true,
    },
    destination_location: {
      type: String,
      required: [true, 'Điểm đến là bắt buộc'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Thời gian Tour là bắt buộc (VD: 6 Ngày 5 Đêm)'],
    },
    departure_date: {
      type: Date,
      required: [true, 'Ngày khởi hành là bắt buộc'],
    },
    end_date: {
      type: Date,
      default: null,
    },
    vehicle: {
      type: String,
      default: 'Ô tô 45 chỗ',
    },
    // Giá duy nhất tại một thời điểm (theo yêu cầu nghiệp vụ M2)
    price: {
      type: Number,
      required: [true, 'Giá Tour là bắt buộc'],
      min: [0, 'Giá Tour phải >= 0'],
    },
    original_price: {
      type: Number,
      default: 0,
      min: [0, 'Giá gốc phải >= 0'],
    },
    // Quản lý chỗ ngồi / slot
    total_slots: {
      type: Number,
      required: [true, 'Tổng số chỗ là bắt buộc'],
      min: [1, 'Tổng số chỗ phải >= 1'],
    },
    remaining_slots: {
      type: Number,
      required: [true, 'Số chỗ còn lại là bắt buộc'],
      min: [0, 'Số chỗ còn lại phải >= 0'],
    },
    // Trạng thái vòng đời Tour
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'FULL', 'CLOSED', 'CANCELLED'],
      default: 'DRAFT',
    },
    // Hình ảnh đại diện và thư viện ảnh
    main_image: {
      type: String,
      required: [true, 'Ảnh đại diện Tour là bắt buộc'],
    },
    gallery: {
      type: [String],
      default: [],
    },
    // Nội dung chi tiết Tour - lưu HTML từ Rich Text Editor (WYSIWYG)
    content_html: {
      type: String,
      default: '',
    },
    // Lịch trình Tour theo từng ngày
    itinerary: [
      {
        day_title: { type: String, required: true },
        description: { type: String, required: true },
        image: { type: String, default: '' },
      },
    ],
    // Điều kiện / ghi chú Tour
    notes: {
      type: String,
      default: '',
    },
    // Xóa mềm (Soft Delete)
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Tạo Index cho các trường lọc, tìm kiếm và sắp xếp
tourSchema.index({ category: 1, region: 1 });
tourSchema.index({ status: 1 });
tourSchema.index({ price: 1 });
tourSchema.index({ departure_date: 1 });
tourSchema.index({ deleted_at: 1 });
tourSchema.index({ title: 'text', destination_location: 'text' });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
