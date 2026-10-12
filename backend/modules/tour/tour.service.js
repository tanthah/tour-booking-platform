const mongoose = require('mongoose');
const Tour = require('./tour.model');

class TourService {
  // ============ PUBLIC API — Khách xem tour (chỉ PUBLISHED) ============

  /**
   * Lấy danh sách Tour đã PUBLISHED có phân trang, lọc, tìm kiếm, sắp xếp
   * Khách hàng chỉ thấy Tour có status = PUBLISHED và chưa bị xóa mềm
   */
  async getPublishedTours(queryParams) {
    const { page = 1, limit = 12, category, region, search, sort, min_price, max_price } = queryParams;

    // Xây dựng bộ lọc query
    const filter = { status: { $in: ['PUBLISHED', 'ACTIVE'] }, deleted_at: null };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        const CategoryModel = require('../category/category.model');
        const cat = await CategoryModel.findOne({ 
          $or: [{ code: category.toUpperCase() }, { slug: category }] 
        });
        filter.category = cat ? cat._id : new mongoose.Types.ObjectId(); // nếu không tìm thấy thì gán 1 ID giả để trả về mảng rỗng
      }
    }
    if (region) filter.region = region;
    if (min_price || max_price) {
      filter.price = {};
      if (min_price) filter.price.$gte = Number(min_price);
      if (max_price) filter.price.$lte = Number(max_price);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { destination_location: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Xác định tiêu chí sắp xếp
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
   * Lấy chi tiết 1 Tour đã PUBLISHED theo ID (dành cho Khách hàng)
   */
  async getPublishedTourById(tourId) {
    const tour = await Tour.findOne({
      _id: tourId,
      status: { $in: ['PUBLISHED', 'ACTIVE'] },
      deleted_at: null,
    }).lean();

    if (!tour) {
      const error = new Error('Tour không tồn tại hoặc chưa được công khai');
      error.statusCode = 404;
      throw error;
    }
    return tour;
  }

  // ============ ADMIN / STAFF API — Quản lý Tour ============

  /**
   * Tạo Tour mới (ADMIN/STAFF) — trạng thái mặc định DRAFT
   */
  async createTour(data) {
    const existingCode = await Tour.findOne({ code: data.code, deleted_at: null });
    if (existingCode) {
      const error = new Error('Mã Tour đã tồn tại trong hệ thống');
      error.statusCode = 409;
      throw error;
    }

    const tour = new Tour({
      ...data,
      status: data.status || 'ACTIVE',
      remaining_slots: data.remaining_slots ?? data.total_slots,
    });
    await tour.save();
    return tour;
  }

  /**
   * Lấy danh sách tất cả Tour (ADMIN/STAFF) — bao gồm mọi trạng thái
   */
  async getAllTours(queryParams) {
    const { page = 1, limit = 12, category, region, status, search, sort } = queryParams;

    const filter = { deleted_at: null };
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        const CategoryModel = require('../category/category.model');
        const cat = await CategoryModel.findOne({ 
          $or: [{ code: category.toUpperCase() }, { slug: category }] 
        });
        filter.category = cat ? cat._id : new mongoose.Types.ObjectId();
      }
    }
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
   * Lấy chi tiết Tour theo ID (ADMIN/STAFF — bao gồm mọi trạng thái)
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
   * Cập nhật thông tin Tour (ADMIN/STAFF)
   * Chỉ cho phép sửa khi Tour ở trạng thái DRAFT hoặc PUBLISHED
   */
  async updateTour(tourId, updateData) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (!['DRAFT', 'PUBLISHED', 'ACTIVE', 'INACTIVE'].includes(tour.status)) {
      const error = new Error(`Không thể chỉnh sửa Tour ở trạng thái ${tour.status}`);
      error.statusCode = 400;
      throw error;
    }

    // Whitelist: chỉ cho phép cập nhật các trường được phép
    const allowedFields = [
      'title', 'description', 'category', 'region',
      'departure_location', 'destination_location', 'duration',
      'departure_date', 'end_date', 'vehicle',
      'price', 'original_price', 'total_slots', 'remaining_slots',
      'price_adult', 'price_child', 'price_baby',
      'original_price_adult', 'original_price_child', 'original_price_baby',
      'max_adults', 'max_children', 'max_babies',
      'main_image', 'gallery', 'content_html', 'itinerary', 'notes',
      'status',
    ];

    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const updatedTour = await Tour.findByIdAndUpdate(
      tourId,
      filteredData,
      { new: true, runValidators: true }
    );
    return updatedTour;
  }

  /**
   * Đổi trạng thái Tour (ADMIN/STAFF) — kiểm tra quy tắc chuyển trạng thái
   */
  async changeStatus(tourId, newStatus) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Bảng quy tắc chuyển trạng thái hợp lệ
    const validTransitions = {
      ACTIVE: ['INACTIVE', 'CLOSED', 'CANCELLED'],
      INACTIVE: ['ACTIVE', 'DRAFT'],
      DRAFT: ['PUBLISHED', 'ACTIVE', 'CANCELLED'],
      PUBLISHED: ['FULL', 'CLOSED', 'CANCELLED', 'INACTIVE'],
      FULL: ['PUBLISHED', 'ACTIVE', 'CLOSED'],
      CLOSED: ['DRAFT', 'ACTIVE'],
      CANCELLED: ['DRAFT', 'ACTIVE'],
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
   * Xóa mềm Tour (ADMIN/STAFF) — đánh dấu deleted_at thay vì xóa vật lý
   */
  async softDeleteTour(tourId) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    tour.deleted_at = new Date();
    await tour.save();
    return { message: 'Đã xóa Tour thành công' };
  }

  // ============ SLOT BOOKING — Dùng transaction tránh overselling ============

  /**
   * Giảm số chỗ còn lại khi có đặt Tour (dùng Mongoose Transaction)
   * Tránh overselling khi nhiều khách cùng đặt đồng thời
   * @param {string} tourId - ID Tour cần đặt
   * @param {number} quantity - Số chỗ cần đặt
   */
  async reserveSlots(tourId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Sử dụng findOneAndUpdate atomic với điều kiện remaining_slots >= quantity
      const tour = await Tour.findOneAndUpdate(
        {
          _id: tourId,
          status: { $in: ['PUBLISHED', 'ACTIVE'] },
          deleted_at: null,
          remaining_slots: { $gte: quantity },
        },
        { $inc: { remaining_slots: -quantity } },
        { new: true, session }
      );

      if (!tour) {
        const error = new Error('Tour không còn đủ chỗ hoặc không ở trạng thái cho phép đặt');
        error.statusCode = 400;
        throw error;
      }

      // Tự động chuyển trạng thái sang FULL nếu hết chỗ
      if (tour.remaining_slots === 0) {
        tour.status = 'FULL';
        await tour.save({ session });
      }

      await session.commitTransaction();
      return tour;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Hoàn trả chỗ khi hủy đặt Tour (dùng Mongoose Transaction)
   * @param {string} tourId - ID Tour cần hoàn trả
   * @param {number} quantity - Số chỗ cần hoàn trả
   */
  async releaseSlots(tourId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tour = await Tour.findOneAndUpdate(
        { _id: tourId, deleted_at: null },
        { $inc: { remaining_slots: quantity } },
        { new: true, session }
      );

      if (!tour) {
        const error = new Error('Tour không tồn tại');
        error.statusCode = 404;
        throw error;
      }

      // Nếu Tour đang FULL và giờ lại có chỗ => chuyển về PUBLISHED
      if (tour.status === 'FULL' && tour.remaining_slots > 0) {
        tour.status = 'PUBLISHED';
        await tour.save({ session });
      }

      await session.commitTransaction();
      return tour;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  /**
   * Xây dựng tiêu chí sắp xếp từ query param sort
   */
  _buildSortOption(sort) {
    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      date_asc: { departure_date: 1 },
      date_desc: { departure_date: -1 },
      newest: { created_at: -1 },
    };
    return sortMap[sort] || { created_at: -1 };
  }
}

module.exports = new TourService();
