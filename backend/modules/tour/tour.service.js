const mongoose = require('mongoose');
const Tour = require('./tour.model');

class TourService {
  /**
   * Lấy danh sách Tour đã PUBLISHED (phân trang, lọc, tìm kiếm, sắp xếp)
   */
  async getPublishedTours(queryParams) {
    const { page = 1, limit = 12, category, region, search, sort, min_price, max_price } = queryParams;
    const filter = { status: 'PUBLISHED', deleted_at: null };

    if (category) filter.category = category;
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
   * Lấy chi tiết 1 Tour đã PUBLISHED theo ID cho khách hàng
   */
  async getPublishedTourById(tourId) {
    const tour = await Tour.findOne({ _id: tourId, status: 'PUBLISHED', deleted_at: null }).lean();
    if (!tour) {
      const error = new Error('Tour không tồn tại hoặc chưa được công khai');
      error.statusCode = 404;
      throw error;
    }
    return tour;
  }

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
      status: 'DRAFT',
      remaining_slots: data.remaining_slots ?? data.total_slots,
    });
    await tour.save();
    return tour;
  }

  /**
   * Lấy danh sách tất cả Tour cho ADMIN/STAFF (bao gồm mọi trạng thái)
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
   * Lấy chi tiết Tour theo ID (ADMIN/STAFF)
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
   * Cập nhật thông tin Tour (ADMIN/STAFF) - Chỉ sửa khi DRAFT hoặc PUBLISHED
   */
  async updateTour(tourId, updateData) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (!['DRAFT', 'PUBLISHED'].includes(tour.status)) {
      const error = new Error(`Không thể chỉnh sửa Tour ở trạng thái ${tour.status}`);
      error.statusCode = 400;
      throw error;
    }

    const allowedFields = [
      'title', 'description', 'category', 'region',
      'departure_location', 'destination_location', 'duration',
      'departure_date', 'end_date', 'vehicle',
      'price', 'original_price', 'total_slots', 'remaining_slots',
      'main_image', 'gallery', 'content_html', 'itinerary', 'notes',
    ];

    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) filteredData[key] = updateData[key];
    });

    return await Tour.findByIdAndUpdate(tourId, filteredData, { new: true, runValidators: true });
  }

  /**
   * Đổi trạng thái Tour (ADMIN/STAFF) theo bảng chuyển trạng thái hợp lệ
   */
  async changeStatus(tourId, newStatus) {
    const tour = await Tour.findOne({ _id: tourId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    const validTransitions = {
      DRAFT: ['PUBLISHED', 'CANCELLED'],
      PUBLISHED: ['FULL', 'CLOSED', 'CANCELLED'],
      FULL: ['PUBLISHED', 'CLOSED'],
      CLOSED: ['DRAFT'],
      CANCELLED: ['DRAFT'],
    };

    const allowed = validTransitions[tour.status] || [];
    if (!allowed.includes(newStatus)) {
      const error = new Error(`Không thể chuyển từ trạng thái ${tour.status} sang ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    tour.status = newStatus;
    await tour.save();
    return tour;
  }

  /**
   * Xóa mềm Tour (ADMIN/STAFF) - Đánh dấu deleted_at
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

  /**
   * Giảm số chỗ còn lại khi đặt Tour (atomic + transaction tránh overselling)
   */
  async reserveSlots(tourId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const tour = await Tour.findOneAndUpdate(
        { _id: tourId, status: 'PUBLISHED', deleted_at: null, remaining_slots: { $gte: quantity } },
        { $inc: { remaining_slots: -quantity } },
        { new: true, session }
      );
      if (!tour) {
        const error = new Error('Tour không còn đủ chỗ hoặc không ở trạng thái cho phép đặt');
        error.statusCode = 400;
        throw error;
      }
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
   * Hoàn trả chỗ khi hủy đặt Tour
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
