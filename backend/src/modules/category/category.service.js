const Category = require('./category.model');

class CategoryService {
  /**
   * Tạo danh mục mới - kiểm tra trùng tên trước khi lưu
   */
  async createCategory(data) {
    const existing = await Category.findOne({ name: data.name, deleted_at: null });
    if (existing) {
      const error = new Error('Tên danh mục đã tồn tại trong hệ thống');
      error.statusCode = 409;
      throw error;
    }

    // Kiểm tra parent_id hợp lệ nếu có
    if (data.parent_id) {
      const parent = await Category.findOne({ _id: data.parent_id, deleted_at: null });
      if (!parent) {
        const error = new Error('Danh mục cha không tồn tại');
        error.statusCode = 400;
        throw error;
      }
    }

    const category = new Category(data);
    await category.save();
    return category;
  }

  /**
   * Lấy danh sách danh mục có phân trang, lọc trạng thái, tìm kiếm theo tên
   */
  async getAllCategories(queryParams) {
    const { page = 1, limit = 10, status, search, sort } = queryParams;

    const filter = { deleted_at: null };
    if (status) filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const sortOption =
      sort === 'name_asc' ? { name: 1 } :
      sort === 'name_desc' ? { name: -1 } :
      sort === 'position' ? { position: 1 } :
      { created_at: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parent_id', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Category.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Lấy danh sách danh mục đang hoạt động (ACTIVE) - dùng cho dropdown chọn danh mục
   */
  async getActiveCategories() {
    return Category.find({ status: 'ACTIVE', deleted_at: null })
      .select('name slug code parent_id position')
      .populate('parent_id', 'name')
      .sort({ position: 1, name: 1 })
      .lean();
  }

  /**
   * Lấy chi tiết danh mục theo ID
   */
  async getCategoryById(categoryId) {
    const category = await Category.findOne({ _id: categoryId, deleted_at: null })
      .populate('parent_id', 'name')
      .lean();
    if (!category) {
      const error = new Error('Danh mục không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  /**
   * Cập nhật thông tin danh mục - kiểm tra trùng tên và parent_id hợp lệ
   */
  async updateCategory(categoryId, updateData) {
    const category = await Category.findOne({ _id: categoryId, deleted_at: null });
    if (!category) {
      const error = new Error('Danh mục không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra tên trùng (nếu đổi tên)
    if (updateData.name && updateData.name !== category.name) {
      const existing = await Category.findOne({
        name: updateData.name,
        deleted_at: null,
        _id: { $ne: categoryId },
      });
      if (existing) {
        const error = new Error('Tên danh mục đã tồn tại trong hệ thống');
        error.statusCode = 409;
        throw error;
      }
    }

    // Kiểm tra parent_id hợp lệ (không được là chính nó)
    if (updateData.parent_id) {
      if (updateData.parent_id.toString() === categoryId.toString()) {
        const error = new Error('Danh mục cha không thể là chính nó');
        error.statusCode = 400;
        throw error;
      }
      const parent = await Category.findOne({ _id: updateData.parent_id, deleted_at: null });
      if (!parent) {
        const error = new Error('Danh mục cha không tồn tại');
        error.statusCode = 400;
        throw error;
      }
    }

    // Whitelist: chỉ cho phép cập nhật các trường được phép
    const allowedFields = ['name', 'parent_id', 'position', 'image', 'description', 'status'];
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Gán dữ liệu mới và lưu để trigger pre-save hook (tự động tạo slug)
    Object.assign(category, filteredData);
    await category.save();

    return category;
  }

  /**
   * Xóa mềm danh mục - kiểm tra không có danh mục con trước khi xóa
   */
  async softDeleteCategory(categoryId) {
    const category = await Category.findOne({ _id: categoryId, deleted_at: null });
    if (!category) {
      const error = new Error('Danh mục không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra có danh mục con không
    const childCount = await Category.countDocuments({
      parent_id: categoryId,
      deleted_at: null,
    });
    if (childCount > 0) {
      const error = new Error('Không thể xóa danh mục đang có danh mục con');
      error.statusCode = 400;
      throw error;
    }

    category.deleted_at = new Date();
    await category.save();
    return { message: 'Xóa danh mục thành công' };
  }
}

module.exports = new CategoryService();

