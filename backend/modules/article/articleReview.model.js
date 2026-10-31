const mongoose = require('mongoose');

/**
 * ArticleReview Schema - Ghi nhận lịch sử quy trình xét duyệt và phân công bài viết
 */
const articleReviewSchema = new mongoose.Schema(
  {
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'ID bài viết là bắt buộc'],
      index: true,
    },
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID người thực hiện là bắt buộc'],
    },
    action: {
      type: String,
      enum: [
        'SUBMITTED',
        'APPROVED',
        'CHANGES_REQUESTED',
        'PUBLISHED',
        'ARCHIVED',
        'ASSIGNED',
        'UNASSIGNED',
      ],
      required: [true, 'Hành động xét duyệt là bắt buộc'],
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Nội dung nhận xét không vượt quá 1000 ký tự'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

articleReviewSchema.index({ article_id: 1, created_at: -1 });

const ArticleReview =
  mongoose.models.ArticleReview ||
  mongoose.model('ArticleReview', articleReviewSchema);

module.exports = ArticleReview;
