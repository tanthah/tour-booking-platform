const mongoose = require('mongoose');

/**
 * Category Schema - Quản lý danh mục Tour du lịch trong MongoDB
 * Hỗ trợ danh mục cha-con (parent_id), xóa mềm (deleted_at)
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên danh mục không quá 100 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Mã định danh ngắn gọn, dùng để tương thích với dữ liệu cũ (VD: DOMESTIC, INTERNATIONAL)
    code: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      default: null,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Mô tả không quá 500 ký tự'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Tạo Index cho các trường thường xuyên truy vấn và tìm kiếm
categorySchema.index({ slug: 1 });
categorySchema.index({ code: 1 });
categorySchema.index({ parent_id: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ deleted_at: 1 });

/**
 * Pre-save Hook: Tự động tạo slug từ trường name (hỗ trợ tiếng Việt)
 * VD: "Tour trong nước" -> "tour-trong-nuoc"
 */
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

