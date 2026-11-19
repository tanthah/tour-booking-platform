const mongoose = require('mongoose');

/**
 * ArticleCategory Schema - Quản lý danh mục bài viết tin tức du lịch
 */
const articleCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên danh mục không quá 100 ký tự'],
    },
    slug: {
      type: String,
      required: [true, 'Slug danh mục là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Mô tả danh mục không quá 500 ký tự'],
    },
    is_active: {
      type: Boolean,
      default: true,
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

articleCategorySchema.index({ is_active: 1 });
articleCategorySchema.index({ deleted_at: 1 });

const ArticleCategory = mongoose.model('ArticleCategory', articleCategorySchema);

module.exports = ArticleCategory;
