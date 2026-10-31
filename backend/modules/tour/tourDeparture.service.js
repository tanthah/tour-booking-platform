const mongoose = require('mongoose');
const TourDeparture = require('./tourDeparture.model');
const Tour = require('./tour.model');

/**
 * TourDepartureService — Xử lý logic nghiệp vụ đợt khởi hành
 * Mỗi đợt thuộc 1 Tour, dùng chung giá từ Tour
 * Sức chứa quản lý riêng; available_slots = total_slots - booked - reserved
 */
class TourDepartureService {
  /**
   * Tạo đợt khởi hành mới cho Tour
   * Điều kiện: Tour phải ACTIVE, ngày khởi hành phải trong tương lai
   */
  async createDeparture(productId, data) {
    const tour = await Tour.findOne({ _id: productId, deleted_at: null });
    if (!tour) {
      const error = new Error('Tour không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (tour.status !== 'ACTIVE') {
      const error = new Error('Chỉ có thể tạo đợt khởi hành khi Tour ở trạng thái ACTIVE');
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra ngày khởi hành phải trong tương lai
    const departureDate = new Date(data.departure_date);
    if (departureDate <= new Date()) {
      const error = new Error('Ngày khởi hành phải là thời điểm trong tương lai');
      error.statusCode = 400;
      throw error;
    }

    const departure = new TourDeparture({
      product_id: productId,
      departure_date: departureDate,
      departure_location: data.departure_location,
      vehicle: data.vehicle || 'Ô tô 45 chỗ',
      meeting_point_address: data.meeting_point_address || '',
      meeting_point_map_url: data.meeting_point_map_url || '',
      meeting_time: data.meeting_time || '',
      start_time: data.start_time || '',
      end_location: data.end_location || '',
      contact_info: data.contact_info || '',
      total_slots: data.total_slots,
      booked_slots: 0,
      reserved_slots: 0,
      status: 'OPEN',
    });

    await departure.save();
    return departure;
  }

  /**
   * Lấy danh sách đợt khởi hành của 1 Tour (Public — chỉ OPEN, còn chỗ)
   */
  async getPublicDepartures(productId) {
    const departures = await TourDeparture.find({
      product_id: productId,
      status: 'OPEN',
      deleted_at: null,
      departure_date: { $gt: new Date() },
    })
      .sort({ departure_date: 1 })
      .lean();

    // Thêm available_slots (virtual không có trong lean)
    return departures.map((d) => ({
      ...d,
      available_slots: d.total_slots - d.booked_slots - d.reserved_slots,
    }));
  }

  /**
   * Lấy danh sách đợt khởi hành (Admin — mọi trạng thái, phân trang)
   */
  async getAllDepartures(productId, queryParams) {
    const { page = 1, limit = 20, status } = queryParams;

    const filter = { product_id: productId, deleted_at: null };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [departures, total] = await Promise.all([
      TourDeparture.find(filter)
        .sort({ departure_date: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      TourDeparture.countDocuments(filter),
    ]);

    // Thêm available_slots (virtual không có trong lean)
    const result = departures.map((d) => ({
      ...d,
      available_slots: d.total_slots - d.booked_slots - d.reserved_slots,
    }));

    return {
      departures: result,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Lấy chi tiết đợt khởi hành theo ID
   */
  async getDepartureById(departureId) {
    const departure = await TourDeparture.findOne({
      _id: departureId,
      deleted_at: null,
    }).lean();

    if (!departure) {
      const error = new Error('Đợt khởi hành không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    departure.available_slots = departure.total_slots - departure.booked_slots - departure.reserved_slots;
    return departure;
  }

  /**
   * Cập nhật đợt khởi hành (Admin)
   * Không cho sửa ngày nếu đã có booking; không cho giảm total_slots < booked + reserved
   */
  async updateDeparture(departureId, updateData) {
    const departure = await TourDeparture.findOne({ _id: departureId, deleted_at: null });
    if (!departure) {
      const error = new Error('Đợt khởi hành không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Không cho sửa ngày khởi hành nếu đã có booking
    if (updateData.departure_date && departure.booked_slots > 0) {
      const error = new Error(
        'Không thể sửa ngày khởi hành khi đã có booking. Hãy hủy đợt này và tạo đợt mới'
      );
      error.statusCode = 400;
      throw error;
    }

    // Không cho giảm total_slots xuống thấp hơn booked + reserved
    if (updateData.total_slots !== undefined) {
      const minSlots = departure.booked_slots + departure.reserved_slots;
      if (updateData.total_slots < minSlots) {
        const error = new Error(
          `Tổng số chỗ không được nhỏ hơn ${minSlots} (đã đặt: ${departure.booked_slots}, giữ tạm: ${departure.reserved_slots})`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Whitelist trường được phép sửa
    const allowedFields = [
      'departure_date', 'departure_location', 'vehicle', 'total_slots',
      'meeting_point_address', 'meeting_point_map_url', 'meeting_time',
      'start_time', 'end_location', 'contact_info',
    ];
    allowedFields.forEach((key) => {
      if (updateData[key] !== undefined) {
        departure[key] = updateData[key];
      }
    });

    await departure.save();

    const result = departure.toObject();
    result.available_slots = departure.total_slots - departure.booked_slots - departure.reserved_slots;
    return result;
  }

  /**
   * Đổi trạng thái đợt khởi hành (Admin)
   */
  async changeStatus(departureId, newStatus) {
    const departure = await TourDeparture.findOne({ _id: departureId, deleted_at: null });
    if (!departure) {
      const error = new Error('Đợt khởi hành không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    const validTransitions = {
      OPEN: ['CLOSED', 'CANCELLED'],
      FULL: ['OPEN', 'CLOSED'],
      CLOSED: ['OPEN'],
      CANCELLED: [],
    };

    const allowed = validTransitions[departure.status] || [];
    if (!allowed.includes(newStatus)) {
      const error = new Error(
        `Không thể chuyển từ trạng thái ${departure.status} sang ${newStatus}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Nếu hủy đợt có booking → cảnh báo
    if (newStatus === 'CANCELLED' && departure.booked_slots > 0) {
      const error = new Error(
        'Đợt khởi hành đã có booking. Vui lòng xử lý đơn/hoàn tiền trước khi hủy'
      );
      error.statusCode = 400;
      throw error;
    }

    departure.status = newStatus;
    await departure.save();
    return departure;
  }

  /**
   * Xóa mềm đợt khởi hành (Admin)
   * Không cho xóa nếu đã có booking
   */
  async softDeleteDeparture(departureId) {
    const departure = await TourDeparture.findOne({ _id: departureId, deleted_at: null });
    if (!departure) {
      const error = new Error('Đợt khởi hành không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (departure.booked_slots > 0) {
      const error = new Error(
        'Không thể xóa đợt khởi hành đã có booking. Hãy dùng trạng thái CANCELLED'
      );
      error.statusCode = 400;
      throw error;
    }

    departure.deleted_at = new Date();
    await departure.save();
    return { message: 'Đã xóa đợt khởi hành thành công' };
  }

  // ============ SLOT BOOKING — Dùng atomic update tránh overselling ============

  /**
   * Giữ chỗ tạm (reserved) khi khách bắt đầu đặt tour
   * Dùng findOneAndUpdate atomic với điều kiện đủ chỗ
   */
  async reserveSlots(departureId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const departure = await TourDeparture.findOneAndUpdate(
        {
          _id: departureId,
          status: 'OPEN',
          deleted_at: null,
          $expr: {
            $gte: [
              { $subtract: ['$total_slots', { $add: ['$booked_slots', '$reserved_slots'] }] },
              quantity,
            ],
          },
        },
        { $inc: { reserved_slots: quantity } },
        { new: true, session }
      );

      if (!departure) {
        const error = new Error('Đợt khởi hành không còn đủ chỗ hoặc không ở trạng thái cho phép đặt');
        error.statusCode = 400;
        throw error;
      }

      // Tự động chuyển FULL nếu hết chỗ
      const available = departure.total_slots - departure.booked_slots - departure.reserved_slots;
      if (available === 0) {
        departure.status = 'FULL';
        await departure.save({ session });
      }

      await session.commitTransaction();
      return departure;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Hoàn trả chỗ đã giữ tạm (khi hết hạn hoặc hủy đơn chưa thanh toán)
   */
  async releaseReservedSlots(departureId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const departure = await TourDeparture.findOneAndUpdate(
        { _id: departureId, deleted_at: null, reserved_slots: { $gte: quantity } },
        { $inc: { reserved_slots: -quantity } },
        { new: true, session }
      );

      if (!departure) {
        const error = new Error('Đợt khởi hành không tồn tại hoặc dữ liệu không hợp lệ');
        error.statusCode = 400;
        throw error;
      }

      // Nếu đang FULL và giờ lại có chỗ → chuyển về OPEN
      const available = departure.total_slots - departure.booked_slots - departure.reserved_slots;
      if (departure.status === 'FULL' && available > 0) {
        departure.status = 'OPEN';
        await departure.save({ session });
      }

      await session.commitTransaction();
      return departure;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Xác nhận booking: chuyển reserved → booked (khi thanh toán thành công)
   */
  async confirmBookingSlots(departureId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const departure = await TourDeparture.findOneAndUpdate(
        { _id: departureId, deleted_at: null, reserved_slots: { $gte: quantity } },
        {
          $inc: { reserved_slots: -quantity, booked_slots: quantity },
        },
        { new: true, session }
      );

      if (!departure) {
        const error = new Error('Không thể xác nhận booking — dữ liệu giữ chỗ không hợp lệ');
        error.statusCode = 400;
        throw error;
      }

      await session.commitTransaction();
      return departure;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Hủy booking đã xác nhận: giải phóng booked_slots
   */
  async releaseBookedSlots(departureId, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const departure = await TourDeparture.findOneAndUpdate(
        { _id: departureId, deleted_at: null, booked_slots: { $gte: quantity } },
        { $inc: { booked_slots: -quantity } },
        { new: true, session }
      );

      if (!departure) {
        const error = new Error('Đợt khởi hành không tồn tại hoặc dữ liệu không hợp lệ');
        error.statusCode = 400;
        throw error;
      }

      // Nếu đang FULL và giờ lại có chỗ → chuyển về OPEN
      const available = departure.total_slots - departure.booked_slots - departure.reserved_slots;
      if (departure.status === 'FULL' && available > 0) {
        departure.status = 'OPEN';
        await departure.save({ session });
      }

      await session.commitTransaction();
      return departure;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new TourDepartureService();
