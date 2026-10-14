const mongoose = require('mongoose');

/**
 * Product (Tour) Schema — Quản lý dữ liệu Tour du lịch trong MongoDB
 * Trạng thái vòng đời: DRAFT → ACTIVE ↔ INACTIVE
 * Giá bán (sale_price) được backend tự tính từ original_price và discount_percent
 * Sức chứa & ngày khởi hành được quản lý ở TourDeparture (quan hệ 1-N)
 */
const tourSchema = new mongoose.Schema(
  {
    // Mã Tour — duy nhất, tự chuyển chữ hoa
    code: {
      type: String,
      required: [true, 'Mã Tour là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Tên Tour
    title: {
      type: String,
      required: [true, 'Tên Tour là bắt buộc'],
      trim: true,
      maxlength: [255, 'Tên Tour không được quá 255 ký tự'],
    },
    // Phân loại: Tour trong nước hoặc quốc tế
    category: {
      type: String,
      enum: ['DOMESTIC', 'INTERNATIONAL'],
      required: [true, 'Phân loại Tour là bắt buộc (DOMESTIC hoặc INTERNATIONAL)'],
    },
    // Khu vực — phải phù hợp với danh mục
    region: {
      type: String,
      enum: ['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'],
      default: null,
    },
    // Điểm đến chính của Tour
    destination_location: {
      type: String,
      required: [true, 'Điểm đến là bắt buộc'],
      trim: true,
    },
    // Thời lượng Tour (VD: "2 Ngày 1 Đêm")
    duration: {
      type: String,
      required: [true, 'Thời gian Tour là bắt buộc (VD: 2 Ngày 1 Đêm)'],
    },
    // ========== GIÁ ==========
    // Giá gốc (VNĐ) — Admin nhập
    original_price: {
      type: Number,
      required: [true, 'Giá gốc là bắt buộc'],
      min: [0, 'Giá gốc phải >= 0'],
    },
    // Phần trăm giảm giá (0–100) — Admin nhập, mặc định 0
    discount_percent: {
      type: Number,
      default: 0,
      min: [0, 'Phần trăm giảm phải >= 0'],
      max: [100, 'Phần trăm giảm phải <= 100'],
    },
    // Giá bán sau giảm — Backend tự tính, KHÔNG nhận từ frontend
    sale_price: {
      type: Number,
      min: [0, 'Giá bán phải >= 0'],
    },
    // ========== ĐÁNH DẤU ==========
    is_flash_sale: {
      type: Boolean,
      default: false,
    },
    is_hot: {
      type: Boolean,
      default: false,
    },
    // ========== HÌNH ẢNH ==========
    main_image: {
      type: String,
      required: [true, 'Ảnh đại diện Tour là bắt buộc'],
    },
    gallery: {
      type: [String],
      default: [],
    },
    // ========== NỘI DUNG ==========
    // Nội dung chi tiết Tour — lưu HTML từ Rich Text Editor (WYSIWYG)
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
        images: { type: [String], default: [] },
        order: { type: Number, default: 0 },
      },
    ],
    // ========== TRẠNG THÁI ==========
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE'],
      default: 'DRAFT',
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

// ========== PRE-SAVE: Tự tính sale_price ==========
tourSchema.pre('save', function (next) {
  if (this.isModified('original_price') || this.isModified('discount_percent')) {
    const discount = this.discount_percent || 0;
    this.sale_price = Math.round(this.original_price * (100 - discount) / 100);
  }
  next();
});

// ========== PRE-FINDONEANDUPDATE: Tự tính sale_price khi update ==========
tourSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.original_price !== undefined || update.discount_percent !== undefined) {
    // Cần lấy giá trị hiện tại nếu chỉ sửa 1 trong 2 trường
    this._needRecalcPrice = true;
  }
  next();
});

// ========== INDEX ==========
tourSchema.index({ category: 1, region: 1 });
tourSchema.index({ sale_price: 1 });
tourSchema.index({ status: 1 });
tourSchema.index({ is_flash_sale: 1 });
tourSchema.index({ deleted_at: 1 });
tourSchema.index({ title: 'text', destination_location: 'text' });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
