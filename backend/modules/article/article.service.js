const Article = require('./article.model');
const ArticleCategory = require('./articleCategory.model');
const { createUniqueSlug } = require('../../utils/slugify');

class ArticleService {
  /**
   * Tạo bài viết mới (Admin)
   */
  async createArticle(data, userId) {
    const slug = await createUniqueSlug(Article, data.title);

    const articleData = {
      title: data.title.trim(),
      slug,
      summary: data.summary ? data.summary.trim() : '',
      cover_image: data.cover_image || { url: '', alt: '', caption: '' },
      content: data.content || [],
      content_source_type: data.content_source_type || 'original',
      sources: Array.isArray(data.sources) ? data.sources : [],
      category_id: data.category_id,
      tags: Array.isArray(data.tags) ? data.tags.map((t) => t.trim()).filter(Boolean) : [],
      related_tour_ids: Array.isArray(data.related_tour_ids) ? data.related_tour_ids : [],
      status: data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      is_featured: Boolean(data.is_featured),
      created_by: userId,
      published_at: data.status === 'PUBLISHED' ? new Date() : null,
    };

    const article = new Article(articleData);
    await article.save();

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('created_by', 'full_name email')
      .lean();
  }

  /**
   * Cập nhật bài viết (Admin)
   */
  async updateArticle(id, data) {
    const article = await Article.findOne({ _id: id, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    if (data.title) article.title = data.title.trim();
    if (data.summary !== undefined) article.summary = data.summary.trim();
    if (data.cover_image !== undefined) article.cover_image = data.cover_image;
    if (data.content !== undefined) article.content = data.content;
    if (data.content_source_type) article.content_source_type = data.content_source_type;
    if (data.sources !== undefined) article.sources = data.sources;
    if (data.category_id) article.category_id = data.category_id;
    if (data.tags !== undefined) {
      article.tags = Array.isArray(data.tags) ? data.tags.map((t) => t.trim()).filter(Boolean) : [];
    }
    if (data.related_tour_ids !== undefined) article.related_tour_ids = data.related_tour_ids;
    if (data.is_featured !== undefined) article.is_featured = Boolean(data.is_featured);

    if (data.status) {
      if (data.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
        article.published_at = new Date();
      }
      article.status = data.status;
    }

    await article.save();

    return Article.findById(article._id)
      .populate('category_id', 'name slug')
      .populate('related_tour_ids', 'title code cover_image original_price sale_price')
      .populate('created_by', 'full_name email')
      .lean();
  }

  /**
   * Bật/tắt trạng thái xuất bản bài viết (Admin)
   */
  async togglePublishStatus(id, publish) {
    const article = await Article.findOne({ _id: id, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }

    const nextStatus = publish !== undefined ? (publish ? 'PUBLISHED' : 'DRAFT') : article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    article.status = nextStatus;
    if (nextStatus === 'PUBLISHED' && !article.published_at) {
      article.published_at = new Date();
    }

    await article.save();
    return article;
  }

  /**
   * Lấy danh sách bài viết quản trị (Admin)
   */
  async getAdminArticles(queryParams = {}) {
    const { page = 1, limit = 15, status, category_id, search, sort } = queryParams;

    const filter = { deleted_at: null };
    if (status) filter.status = status;
    if (category_id) filter.category_id = category_id;
    if (search) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { summary: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortOption = sort === 'oldest' ? { created_at: 1 } : { created_at: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate('category_id', 'name slug')
        .populate('created_by', 'full_name email')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Article.countDocuments(filter),
    ]);

    return {
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Lấy chi tiết bài viết quản trị (Admin)
   */
  async getAdminArticleById(id) {
    const article = await Article.findOne({ _id: id, deleted_at: null })
      .populate('category_id', 'name slug')
      .populate('related_tour_ids', 'title code cover_image original_price sale_price')
      .populate('created_by', 'full_name email')
      .lean();

    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }
    return article;
  }

  /**
   * Xóa mềm bài viết (Admin)
   */
  async deleteArticle(id) {
    const article = await Article.findOne({ _id: id, deleted_at: null });
    if (!article) {
      const error = new Error('Không tìm thấy bài viết');
      error.statusCode = 404;
      throw error;
    }
    article.deleted_at = new Date();
    await article.save();
    return { success: true };
  }

  /**
   * Lấy danh sách bài viết đã xuất bản (Public Client)
   */
  async getPublishedArticles(queryParams = {}) {
    const { page = 1, limit = 9, category, search, sort } = queryParams;

    const filter = { status: 'PUBLISHED', deleted_at: null };

    if (category) {
      const catDoc = await ArticleCategory.findOne({
        slug: category,
        deleted_at: null,
      }).select('_id');
      if (catDoc) {
        filter.category_id = catDoc._id;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { summary: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    let sortOption = { published_at: -1 };
    if (sort === 'popular') sortOption = { view_count: -1, published_at: -1 };
    if (sort === 'oldest') sortOption = { published_at: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .select('title slug summary cover_image category_id published_at view_count tags')
        .populate('category_id', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Article.countDocuments(filter),
    ]);

    return {
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Lấy danh sách bài nổi bật (theo lượt xem hoặc cờ is_featured)
   */
  async getFeaturedArticles(limit = 5) {
    return Article.find({ status: 'PUBLISHED', deleted_at: null })
      .select('title slug summary cover_image category_id published_at view_count')
      .populate('category_id', 'name slug')
      .sort({ is_featured: -1, view_count: -1, published_at: -1 })
      .limit(Number(limit))
      .lean();
  }

  /**
   * Lấy chi tiết bài viết theo slug (Public Client - Tự động tăng view_count)
   */
  async getArticleBySlug(slug) {
    const article = await Article.findOneAndUpdate(
      { slug, status: 'PUBLISHED', deleted_at: null },
      { $inc: { view_count: 1 } },
      { new: true }
    )
      .populate('category_id', 'name slug')
      .populate('related_tour_ids', 'title code cover_image original_price sale_price rating total_reviews slug')
      .lean();

    if (!article) {
      const error = new Error('Bài viết không tồn tại hoặc đã gỡ');
      error.statusCode = 404;
      throw error;
    }

    return article;
  }

  /**
   * Lấy các bài viết liên quan (cùng danh mục, trừ bài hiện tại)
   */
  async getRelatedArticles(slug, limit = 4) {
    const current = await Article.findOne({ slug, deleted_at: null }).select('_id category_id');
    if (!current) return [];

    return Article.find({
      _id: { $ne: current._id },
      category_id: current.category_id,
      status: 'PUBLISHED',
      deleted_at: null,
    })
      .select('title slug summary cover_image category_id published_at view_count')
      .populate('category_id', 'name slug')
      .sort({ published_at: -1 })
      .limit(Number(limit))
      .lean();
  }
}

module.exports = new ArticleService();
