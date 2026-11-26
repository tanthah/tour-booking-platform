const Tour = require('./tour.model');
const Category = require('../category/category.model');
const {
  extractPublicIdFromUrl,
  cleanupRemovedImages,
  deleteImages,
} = require('../../utils/cloudinaryHelper');

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
    const { page = 1, limit = 12, category_id, category, region, search, sort, min_price, max_price } = queryParams;

    const filter = { status: 'ACTIVE', deleted_at: null };

    if (category_id) {
      filter.category_id = category_id;
    } else if (category) {
      // Hỗ trợ lọc theo mã DOMESTIC / INTERNATIONAL hoặc Category root
      try {
        const root = await Category.findOne({
          $or: [{ code: category.toUpperCase() }, { slug: category.toLowerCase() }],
          deleted_at: null,
        });
        if (root) {
          const children = await Category.find({ parent_id: root._id, deleted_at: null }).select('_id');
          const catIds = [root._id, ...children.map((c) => c._id)];
          filter.$or = [{ category_id: { $in: catIds } }, { category: category.toUpperCase() }];
        } else {
          filter.category = category;
        }
      } catch {
        filter.category = category;
      }
    }

    if (region) filter.region = region;
    if (min_price || max_price) {
      filter.sale_price = {};
      if (min_price) filter.sale_price.$gte = Number(min_price);
      if (max_price) filter.sale_price.$lte = Number(max_price);
    }
    if (search) {
      const searchCondition = [
        { title: { $regex: search, $options: 'i' } },
        { destination_location: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    const sortOption = this._buildSortOption(sort);
    const skip = (Number(page) - 1) * Number(limit);

    const [tours, total] = await Promise.all([
      Tour.find(filter)
        .populate('category_id', 'name slug parent_id')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
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
    })
      .populate('category_id', 'name slug parent_id')
      .lean();

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
    this._normalizeImagePublicIds(tourData);

    if (tourData.category_id && !tourData.category) {
      try {
        const cat = await Category.findById(tourData.category_id).populate('parent_id');
        if (cat) {
          const rootCode = cat.parent_id?.code || cat.code;
          if (rootCode) tourData.category = rootCode;
        }
      } catch (err) {
        console.error('Lỗi suy diễn root category:', err);
      }
    }

    const tour = new Tour(tourData);
    // Pre-save hook sẽ tự tính sale_price
    await tour.save();
    return tour;
  }

  /**
   * Lấy danh sách tất cả Tour (ADMIN — bao gồm mọi trạng thái)
   */
  async getAllTours(queryParams) {
    const { page = 1, limit = 12, category_id, category, region, status, search, sort } = queryParams;

    const filter = { deleted_at: null };
    if (category_id) {
      filter.category_id = category_id;
    } else if (category) {
      try {
        const root = await Category.findOne({
          $or: [{ code: category.toUpperCase() }, { slug: category.toLowerCase() }],
          deleted_at: null,
        });
        if (root) {
          const children = await Category.find({ parent_id: root._id, deleted_at: null }).select('_id');
          const catIds = [root._id, ...children.map((c) => c._id)];
          filter.$or = [{ category_id: { $in: catIds } }, { category: category.toUpperCase() }];
        } else {
          filter.category = category;
        }
      } catch {
        filter.category = category;
      }
    }

    if (region) filter.region = region;
    if (status) filter.status = status;
    if (search) {
      const searchCondition = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    const sortOption = this._buildSortOption(sort);
    const skip = (Number(page) - 1) * Number(limit);

    const [tours, total] = await Promise.all([
      Tour.find(filter)
        .populate('category_id', 'name slug parent_id')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
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
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null })
      .populate('category_id', 'name slug parent_id')
      .lean();
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

    const oldImageEntries = this._collectTourImageEntries(tour);

    // Whitelist: chỉ cho phép cập nhật các trường được phép
    const allowedFields = [
      'title', 'category_id', 'category', 'region', 'destination_location', 'duration',
      'original_price', 'discount_percent',
      'is_flash_sale', 'is_hot',
      'main_image', 'main_image_public_id', 'gallery', 'gallery_public_ids',
      'content_html', 'itinerary',
      'highlights', 'notes',
      'services_included', 'services_excluded', 'special_conditions',
      'status',
    ];

    const normalizedUpdate = { ...updateData };
    if (
      normalizedUpdate.main_image !== undefined &&
      normalizedUpdate.main_image !== tour.main_image &&
      normalizedUpdate.main_image_public_id === undefined
    ) {
      normalizedUpdate.main_image_public_id = extractPublicIdFromUrl(normalizedUpdate.main_image) || null;
    }
    this._normalizeImagePublicIds(normalizedUpdate);

    // Lọc và gán từng trường được phép
    allowedFields.forEach((key) => {
      if (normalizedUpdate[key] !== undefined) {
        tour[key] = normalizedUpdate[key];
      }
    });

    if (normalizedUpdate.category_id) {
      try {
        const cat = await Category.findById(normalizedUpdate.category_id).populate('parent_id');
        if (cat) {
          const rootCode = cat.parent_id?.code || cat.code;
          if (rootCode) tour.category = rootCode;
        }
      } catch (err) {
        console.error('Lỗi suy diễn root category khi update:', err);
      }
    }

    // Không tin sale_price từ frontend — pre-save hook sẽ tự tính
    await tour.save();

    const newImageEntries = this._collectTourImageEntries(tour);
    await cleanupRemovedImages(oldImageEntries, newImageEntries);

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

    const imageTargets = this._collectTourImageEntries(tour).map(
      (entry) => entry.public_id || entry.url
    );
    await deleteImages(imageTargets);

    return { message: 'Đã xóa Tour thành công' };
  }

  // ============ PRIVATE HELPER METHODS ============

  _collectTourImageEntries(tour) {
    const entries = [];
    if (tour.main_image || tour.main_image_public_id) {
      entries.push({ url: tour.main_image || '', public_id: tour.main_image_public_id || '' });
    }
    const gallery = Array.isArray(tour.gallery) ? tour.gallery : [];
    const galleryPublicIds = Array.isArray(tour.gallery_public_ids) ? tour.gallery_public_ids : [];
    gallery.forEach((url, idx) => {
      entries.push({ url: url || '', public_id: galleryPublicIds[idx] || '' });
    });
    const itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];
    itinerary.forEach((day) => {
      if (!day) return;
      if (day.image || day.image_public_id) {
        entries.push({ url: day.image || '', public_id: day.image_public_id || '' });
      }
      const dayImages = Array.isArray(day.images) ? day.images : [];
      const dayPublicIds = Array.isArray(day.images_public_ids) ? day.images_public_ids : [];
      dayImages.forEach((url, idx) => {
        entries.push({ url: url || '', public_id: dayPublicIds[idx] || '' });
      });
    });
    return entries;
  }

  _normalizeImagePublicIds(data) {
    if (data.main_image !== undefined && !data.main_image_public_id) {
      data.main_image_public_id = extractPublicIdFromUrl(data.main_image) || null;
    }
    if (Array.isArray(data.gallery)) {
      const providedIds = Array.isArray(data.gallery_public_ids) ? data.gallery_public_ids : [];
      data.gallery_public_ids = data.gallery.map(
        (url, idx) => providedIds[idx] || extractPublicIdFromUrl(url) || ''
      );
    }
    if (Array.isArray(data.itinerary)) {
      data.itinerary = data.itinerary.map((day) => {
        if (!day || typeof day !== 'object') return day;
        const normalizedDay = { ...day };
        if (normalizedDay.image !== undefined && !normalizedDay.image_public_id) {
          normalizedDay.image_public_id = extractPublicIdFromUrl(normalizedDay.image) || '';
        }
        if (Array.isArray(normalizedDay.images)) {
          const dayIds = Array.isArray(normalizedDay.images_public_ids)
            ? normalizedDay.images_public_ids
            : [];
          normalizedDay.images_public_ids = normalizedDay.images.map(
            (url, idx) => dayIds[idx] || extractPublicIdFromUrl(url) || ''
          );
          if (!normalizedDay.image_public_id && normalizedDay.images_public_ids[0]) {
            normalizedDay.image_public_id = normalizedDay.images_public_ids[0];
          }
        }
        return normalizedDay;
      });
    }
  }

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
