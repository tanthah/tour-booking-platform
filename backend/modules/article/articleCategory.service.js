const ArticleCategory = require('./articleCategory.model');
const { createUniqueSlug } = require('../../utils/slugify');

const DEFAULT_CATEGORIES = [
  { name: 'Điểm tham quan', description: 'Khám phá các danh lam thắng cảnh và địa điểm nổi tiếng' },
  { name: 'Khách sạn & Resort', description: 'Gợi ý nơi lưu trú sang trọng, tiện nghi và phù hợp ngân sách' },
  { name: 'Cẩm nang du lịch', description: 'Kinh nghiệm, mẹo hữu ích và lịch trình du lịch chi tiết' },
  { name: 'Văn hóa – Ẩm thực', description: 'Trải nghiệm phong vị ẩm thực đặc sắc và nét đẹp văn hóa địa phương' },
];

class ArticleCategoryService {
  /**
   * Khởi tạo danh mục mặc định nếu hệ thống chưa có danh mục nào
   */
  async ensureDefaultCategories() {
    const count = await ArticleCategory.countDocuments({ deleted_at: null });
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        const slug = await createUniqueSlug(ArticleCategory, cat.name);
        await ArticleCategory.create({ ...cat, slug });
      }
    }
  }

  /**
   * Tạo mới danh mục bài viết
   */
  async createCategory(data) {
    const existing = await ArticleCategory.findOne({ name: data.name.trim(), deleted_at: null });
    if (existing) {
      const error = new Error('Tên danh mục đã tồn tại trong hệ thống');
      error.statusCode = 409;
      throw error;
    }

    const slug = await createUniqueSlug(ArticleCategory, data.name);
    const category = new ArticleCategory({
      name: data.name.trim(),
      slug,
      description: data.description || '',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });

    await category.save();
    return category;
  }

  /**
   * Lấy danh sách danh mục cho Admin (phân trang, tìm kiếm, lọc trạng thái)
   */
  async getAllCategories(queryParams = {}) {
    await this.ensureDefaultCategories();
    const { page = 1, limit = 20, status, search } = queryParams;

    const filter = { deleted_at: null };
    if (status === 'active') filter.is_active = true;
    if (status === 'inactive') filter.is_active = false;
    if (search) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [categories, total] = await Promise.all([
      ArticleCategory.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ArticleCategory.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Lấy danh sách danh mục đang hoạt động (dùng cho dropdown Admin và bộ lọc Client)
   */
  async getActiveCategories() {
    await this.ensureDefaultCategories();
    return ArticleCategory.find({ is_active: true, deleted_at: null })
      .sort({ created_at: -1 })
      .lean();
  }

  /**
   * Lấy chi tiết danh mục theo ID
   */
  async getCategoryById(id) {
    const category = await ArticleCategory.findOne({ _id: id, deleted_at: null });
    if (!category) {
      const error = new Error('Không tìm thấy danh mục');
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(id, data) {
    const category = await this.getCategoryById(id);

    if (data.name && data.name.trim() !== category.name) {
      const existing = await ArticleCategory.findOne({
        _id: { $ne: id },
        name: data.name.trim(),
        deleted_at: null,
      });
      if (existing) {
        const error = new Error('Tên danh mục đã tồn tại');
        error.statusCode = 409;
        throw error;
      }
      category.name = data.name.trim();
      category.slug = await createUniqueSlug(ArticleCategory, data.name.trim(), id);
    }

    if (data.description !== undefined) category.description = data.description;
    if (data.is_active !== undefined) category.is_active = Boolean(data.is_active);

    await category.save();
    return category;
  }

  /**
   * Bật/tắt trạng thái hoạt động của danh mục
   */
  async toggleCategoryStatus(id, isActive) {
    const category = await this.getCategoryById(id);
    category.is_active = isActive !== undefined ? Boolean(isActive) : !category.is_active;
    await category.save();
    return category;
  }

  /**
   * Xóa mềm danh mục
   */
  async deleteCategory(id) {
    const category = await this.getCategoryById(id);
    category.deleted_at = new Date();
    await category.save();
    return { success: true };
  }
}

module.exports = new ArticleCategoryService();
