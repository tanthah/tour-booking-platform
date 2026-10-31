const mongoose = require('mongoose');

/**
 * Article Schema - Quản lý bài viết tin tức, cẩm nang du lịch
 */
const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề bài viết là bắt buộc'],
      trim: true,
      maxlength: [255, 'Tiêu đề bài viết không quá 255 ký tự'],
    },
    slug: {
      type: String,
      required: [true, 'Slug bài viết là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
      maxlength: [600, 'Tóm tắt bài viết không quá 600 ký tự'],
    },
    cover_image: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
      alt: { type: String, default: '' },
      caption: { type: String, default: '' },
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    content_source_type: {
      type: String,
      enum: ['original', 'curated'],
      default: 'original',
    },
    sources: [
      {
        title: { type: String, default: '' },
        url: { type: String, default: '' },
        author: { type: String, default: '' },
        accessed_at: { type: Date, default: null },
      },
    ],
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArticleCategory',
      required: [true, 'Danh mục bài viết là bắt buộc'],
    },
    tags: {
      type: [String],
      default: [],
    },
    related_tour_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
    ],
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED',
        'PUBLISHED',
        'ARCHIVED',
      ],
      default: 'DRAFT',
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    view_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submitted_at: {
      type: Date,
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
    },
    published_at: {
      type: Date,
      default: null,
    },
    review_comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Ghi chú duyệt bài không quá 1000 ký tự'],
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

articleSchema.index({ status: 1, published_at: -1 });
articleSchema.index({ status: 1, submitted_at: -1 });
articleSchema.index({ category_id: 1, status: 1 });
articleSchema.index({ is_featured: 1, status: 1 });
articleSchema.index({ view_count: -1 });
articleSchema.index({ assigned_to: 1 });
articleSchema.index({ created_by: 1 });
articleSchema.index({ deleted_at: 1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
