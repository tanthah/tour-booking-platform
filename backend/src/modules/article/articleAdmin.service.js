const Article = require('./article.model');
const ArticleReview = require('./articleReview.model');

class ArticleAdminService {
  /**
   * Gửi bài viết sang hàng đợi duyệt (Submit for Review)
   */
  async submitForReview(articleId, userId) {
    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(article.status)) {
      const error = new Error('Chỉ có thể gửi duyệt bài viết ở trạng thái Bản nháp hoặc Cần chỉnh sửa');
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra các trường thông tin bắt buộc trước khi gửi duyệt
    if (!article.title || !article.title.trim()) {
      const error = new Error('Vui lòng nhập tiêu đề bài viết trước khi gửi duyệt');
      error.statusCode = 400;
      throw error;
    }

    if (!article.summary || !article.summary.trim()) {
      const error = new Error('Vui lòng nhập tóm tắt bài viết (Sapo) trước khi gửi duyệt');
      error.statusCode = 400;
      throw error;
    }

    // Quy định #3: Ảnh bìa bắt buộc trước khi gửi duyệt
    if (!article.cover_image?.url) {
      const error = new Error('Vui lòng tải lên ảnh bìa đại diện trước khi gửi duyệt bài');
      error.statusCode = 400;
      throw error;
    }

    if (!article.category_id) {
      const error = new Error('Vui lòng chọn danh mục bài viết trước khi gửi duyệt');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(article.content) || article.content.length === 0) {
      const error = new Error('Nội dung bài viết không được để trống khi gửi duyệt');
      error.statusCode = 400;
      throw error;
    }

    if (article.content_source_type === 'curated') {
      const validSources = (article.sources || []).filter(
        (s) => (s.title && s.title.trim()) || (s.url && s.url.trim())
      );
      if (validSources.length === 0) {
        const error = new Error('Bài viết tổng hợp (curated) bắt buộc phải có ít nhất 1 nguồn tham khảo');
        error.statusCode = 400;
        throw error;
      }
    }

    article.status = 'PENDING_REVIEW';
    article.submitted_at = new Date();
    article.review_comment = '';
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: userId,
      action: 'SUBMITTED',
      comment: 'Gửi bài viết yêu cầu phê duyệt',
    });

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .lean();
  }

  /**
   * Lấy danh sách hàng đợi duyệt bài (Review Queue)
   */
  async getReviewQueue(queryParams = {}) {
    const { page = 1, limit = 15, category_id, search } = queryParams;

    const filter = { status: 'PENDING_REVIEW', deleted_at: null };
    if (category_id) filter.category_id = category_id;
    if (search) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { summary: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate('category_id', 'name slug')
        .populate('created_by', 'full_name email')
        .populate('assigned_to', 'full_name email')
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Article.countDocuments(filter),
    ]);

    return {
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Phê duyệt bài viết (Approve)
   */
  async approveArticle(articleId, reviewerId, note = '') {
    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    if (article.status !== 'PENDING_REVIEW') {
      const error = new Error('Chỉ có thể phê duyệt bài viết đang ở trạng thái Chờ duyệt');
      error.statusCode = 400;
      throw error;
    }

    article.status = 'APPROVED';
    article.approved_at = new Date();
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: reviewerId,
      action: 'APPROVED',
      comment: note ? note.trim() : 'Đã duyệt nội dung bài viết',
    });

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .lean();
  }

  /**
   * Yêu cầu tác giả chỉnh sửa bài viết (Request Changes)
   */
  async requestChanges(articleId, reviewerId, comment) {
    if (!comment || !comment.trim()) {
      const error = new Error('Vui lòng nhập lý do / phản hồi cần chỉnh sửa');
      error.statusCode = 400;
      throw error;
    }

    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    if (!['PENDING_REVIEW', 'APPROVED'].includes(article.status)) {
      const error = new Error('Bài viết không ở trạng thái Chờ duyệt hoặc Đã duyệt');
      error.statusCode = 400;
      throw error;
    }

    article.status = 'CHANGES_REQUESTED';
    article.review_comment = comment.trim();
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: reviewerId,
      action: 'CHANGES_REQUESTED',
      comment: comment.trim(),
    });

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .lean();
  }

  /**
   * Xuất bản bài viết đã được phê duyệt (Publish)
   */
  async publishArticle(articleId, publisherId) {
    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    article.status = 'PUBLISHED';
    if (!article.published_at) {
      article.published_at = new Date();
    }
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: publisherId,
      action: 'PUBLISHED',
      comment: 'Xuất bản bài viết lên hệ thống công khai',
    });

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .lean();
  }

  /**
   * Lưu trữ bài viết (Archive)
   */
  async archiveArticle(articleId, adminId) {
    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    article.status = 'ARCHIVED';
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: adminId,
      action: 'ARCHIVED',
      comment: 'Lưu trữ bài viết',
    });

    return article;
  }

  /**
   * Phân công nhân viên biên tập bài viết (Assign)
   */
  async assignArticle(articleId, assignedToId, adminId, note = '') {
    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    article.assigned_to = assignedToId;
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: adminId,
      action: 'ASSIGNED',
      comment: note ? note.trim() : 'Phân công nhân viên phụ trách bài viết',
    });

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .lean();
  }

  /**
   * Hủy phân công nhân viên (Unassign)
   */
  async unassignArticle(articleId, adminId) {
    const article = await Article.findOne({ _id: articleId, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    article.assigned_to = null;
    await article.save();

    await ArticleReview.create({
      article_id: article._id,
      reviewer_id: adminId,
      action: 'UNASSIGNED',
      comment: 'Hủy phân công nhân viên phụ trách',
    });

    return article;
  }

  /**
   * Lấy lịch sử xét duyệt và phân công của bài viết
   */
  async getReviewHistory(articleId) {
    return ArticleReview.find({ article_id: articleId })
      .populate('reviewer_id', 'full_name email roles')
      .sort({ created_at: -1 })
      .lean();
  }
}

module.exports = new ArticleAdminService();
