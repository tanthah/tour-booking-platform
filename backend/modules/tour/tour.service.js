const Tour = require('./tour.model');

/**
 * TourService — Xử lý logic nghiệp vụ Tour (không bao gồm đợt khởi hành)
 * Giá bán (sale_price) luôn được backend tính từ original_price và discount_percent
 */
class TourService {
  // ============ PUBLIC API — Khách xem tour (chỉ ACTIVE) ============

  /**
   * Lấy danh sách Tour đang ACTIVE có phân trang, lọc, tìm kiếm, sắp xếp
   */
  async getPublishedTours(queryParams) {
    const { page = 1, limit = 12, category, region, search, sort, min_price, max_price } = queryParams;

    const filter = { status: 'ACTIVE', deleted_at: null };

    if (category) filter.category = category;
    if (region) filter.region = region;
    if (min_price || max_price) {
      filter.sale_price = {};
      if (min_price) filter.sale_price.$gte = Number(min_price);
      if (max_price) filter.sale_price.$lte = Number(max_price);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { destination_location: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption = this._buildSortOption(sort);
    const skip = (Number(page) - 1) * Number(limit);

    const [tours, total] = await Promise.all([
      Tour.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
      Tour.countDocuments(filter),
    ]);

    return {
      tours,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Lấy chi tiết 1 Tour đang ACTIVE theo ID (dành cho Khách hàng)
   */
  async getPublishedTourById(tourId) {
    const tour = await Tour.findOne({
      _id: tourId,
      status: 'ACTIVE',
      deleted_at: null,
    }).lean();

    if (!tour) {
      const error = new Error('Tour không tồn tại hoặc chưa được công khai');
      error.statusCode = 404;
      throw error;
    }
    return tour;
  }

  // ============ ADMIN API — Quản lý Tour ============

  /**
   * Tạo Tour mới (ADMIN) — Backend tự tính sale_price
   */
  async createTour(data) {
    const existingCode = await Tour.findOne({ code: data.code, deleted_at: null });
    if (existingCode) {
      const error = new Error('Mã Tour đã tồn tại trong hệ thống');
      error.statusCode = 409;
      throw error;
    }

    // Không tin sale_price từ frontend
    const tourData = { ...data };
    delete tourData.sale_price;

    const tour = new Tour(tourData);
    // Pre-save hook sẽ tự tính sale_price
    await tour.save();
    return tour;
  }

  /**
   * Lấy danh sách tất cả Tour (ADMIN — bao gồm mọi trạng thái)
   */
  async getAllTours(queryParams) {
    const { page = 1, limit = 12, category, region, status, search, sort } = queryParams;

    const filter = { deleted_at: null };
    if (category) filter.category = category;
    if (region) filter.region = region;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption = this._buildSortOption(sort);
    const skip = (Number(page) - 1) * Number(limit);

    const [tours, total] = await Promise.all([
      Tour.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
      Tour.countDocuments(filter),
    ]);

    return {
      tours,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Lấy chi tiết Tour theo ID (ADMIN — mọi trạng thái)
   */
  async getTourById(tourId) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null }).lean();
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    return tour;
  }

  /**
   * Cập nhật thông tin Tour (ADMIN)
   * Backend tự tính lại sale_price nếu sửa giá hoặc phần trăm giảm
   */
  async updateTour(tourId, updateData) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (!['DRAFT', 'ACTIVE', 'INACTIVE'].includes(tour.status)) {
      const error = new Error(`Không thể chỉnh sửa Tour ở trạng thái ${tour.status}`);
      error.statusCode = 400;
      throw error;
    }

    // Whitelist: chỉ cho phép cập nhật các trường được phép
    const allowedFields = [
      'title', 'category', 'region', 'destination_location', 'duration',
      'original_price', 'discount_percent',
      'is_flash_sale', 'is_hot',
      'main_image', 'gallery', 'content_html', 'itinerary',
      'status',
    ];

    // Lọc và gán từng trường được phép
    allowedFields.forEach((key) => {
      if (updateData[key] !== undefined) {
        tour[key] = updateData[key];
      }
    });

    // Không tin sale_price từ frontend — pre-save hook sẽ tự tính
    await tour.save();
    return tour;
  }

  /**
   * Đổi trạng thái Tour (ADMIN) — kiểm tra quy tắc chuyển trạng thái
   */
  async changeStatus(tourId, newStatus) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    const validTransitions = {
      DRAFT: ['ACTIVE'],
      ACTIVE: ['INACTIVE'],
      INACTIVE: ['ACTIVE', 'DRAFT'],
    };

    const allowed = validTransitions[tour.status] || [];
    if (!allowed.includes(newStatus)) {
      const error = new Error(
        `Không thể chuyển từ trạng thái ${tour.status} sang ${newStatus}`
      );
      error.statusCode = 400;
      throw error;
    }

    tour.status = newStatus;
    await tour.save();
    return tour;
  }

  /**
   * Xóa mềm Tour (ADMIN) — đánh dấu deleted_at thay vì xóa vật lý
   */
  async softDeleteTour(tourId) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // TODO: Kiểm tra ràng buộc Booking trước khi xóa
    tour.deleted_at = new Date();
    await tour.save();
    return { message: 'Đã xóa Tour thành công' };
  }

  // ============ PRIVATE HELPER METHODS ============

  _buildSortOption(sort) {
    const sortMap = {
      price_asc: { sale_price: 1 },
      price_desc: { sale_price: -1 },
      newest: { created_at: -1 },
    };
    return sortMap[sort] || { created_at: -1 };
  }
}

module.exports = new TourService();
