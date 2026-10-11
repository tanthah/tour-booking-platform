const mongoose = require('mongoose');

/**
 * Product (Tour) Schema - Model quản lý dữ liệu Tour du lịch trong MongoDB
 */
const productSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['DOMESTIC', 'INTERNATIONAL'],
      required: [true, 'Phân loại danh mục Tour là bắt buộc (DOMESTIC hoặc INTERNATIONAL)'],
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
      required: [true, 'Thời gian Tour là bắt buộc (ví dụ: 6 Ngày 5 Đêm)'],
    },
    departure_date: {
      type: Date,
      required: [true, 'Ngày khởi hành là bắt buộc'],
    },
    vehicle: {
      type: String,
      default: 'Ô tô 45 chỗ',
    },
    original_price: {
      type: Number,
      required: [true, 'Giá gốc là bắt buộc'],
    },
    sale_price: {
      type: Number,
      required: [true, 'Giá bán là bắt buộc'],
    },
    adult_price: {
      type: Number,
      required: true,
    },
    child_price: {
      type: Number,
      default: 0,
    },
    baby_price: {
      type: Number,
      default: 0,
    },
    discount_percent: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    reviews_count: {
      type: Number,
      default: 500,
    },
    remaining_slots: {
      type: Number,
      default: 10,
    },
    is_flash_sale: {
      type: Boolean,
      default: false,
    },
    is_hot: {
      type: Boolean,
      default: false,
    },
    main_image: {
      type: String,
      required: [true, 'Ảnh đại diện Tour là bắt buộc'],
    },
    gallery: {
      type: [String],
      default: [],
    },
    // Nội dung thông tin chi tiết Tour (hỗ trợ lưu HTML từ Rich Text / WYSIWYG Editor của Admin)
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
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Tạo Index cho các trường lọc & tìm kiếm
productSchema.index({ category: 1, region: 1 });
productSchema.index({ sale_price: 1 });
productSchema.index({ is_flash_sale: 1 });
productSchema.index({ deleted_at: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
