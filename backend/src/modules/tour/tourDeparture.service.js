const mongoose = require('mongoose');
const TourDeparture = require('./tourDeparture.model');
const Tour = require('./tour.model');
const DepartureChangeLog = require('./departureChangeLog.model');
const Order = require('../order/order.model');
const emailService = require('../email/email.service');

/**
 * TourDepartureService — Xử lý logic nghiệp vụ đợt/lịch khởi hành
 * Phiên bản cập nhật:
 * - Quản lý ngày giờ bắt đầu tour (start_datetime) và địa điểm tập trung (meeting_point).
 * - Quản lý sức chứa (total_slots, booked_slots, reserved_slots, available_slots).
 * - Lưu lịch sử và gửi thông báo khi thay đổi địa điểm tập trung.
 */
class TourDepartureService {
  /**
   * Tạo đợt khởi hành mới cho Tour
   * Điều kiện: Tour phải ACTIVE, ngày bắt đầu phải trong tương lai
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

    // Kiểm tra ngày bắt đầu phải trong tương lai
    const startDatetime = new Date(data.start_datetime || data.departure_date);
    if (isNaN(startDatetime.getTime()) || startDatetime <= new Date()) {
      const error = new Error('Ngày giờ bắt đầu tour phải là thời điểm trong tương lai');
      error.statusCode = 400;
      throw error;
    }

    const meetingPoint = (data.meeting_point || data.meeting_point_address || '').trim();
    if (!meetingPoint) {
      const error = new Error('Địa điểm tập trung là bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    const totalSlots = Number(data.total_slots);
    if (!totalSlots || totalSlots < 1) {
      const error = new Error('Tổng số chỗ phải lớn hơn hoặc bằng 1');
      error.statusCode = 400;
      throw error;
    }

    const departure = new TourDeparture({
      product_id: productId,
      start_datetime: startDatetime,
      meeting_point: meetingPoint,
      total_slots: totalSlots,
      booked_slots: 0,
      reserved_slots: 0,
      status: 'OPEN',
    });

    await departure.save();
    return departure;
  }

  /**
   * Lấy danh sách đợt khởi hành của 1 Tour (Public — chỉ OPEN, còn hạn)
   */
  async getPublicDepartures(productId) {
    const departures = await TourDeparture.find({
      product_id: productId,
      status: 'OPEN',
      deleted_at: null,
      start_datetime: { $gt: new Date() },
    })
      .sort({ start_datetime: 1 })
      .lean();

    return departures.map((d) => ({
      ...d,
      available_slots: (d.total_slots || 0) - (d.booked_slots || 0) - (d.reserved_slots || 0),
      departure_date: d.start_datetime, // Hỗ trợ tương thích ngược
      meeting_point_address: d.meeting_point, // Hỗ trợ tương thích ngược
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
        .sort({ start_datetime: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      TourDeparture.countDocuments(filter),
    ]);

    const result = departures.map((d) => ({
      ...d,
      available_slots: (d.total_slots || 0) - (d.booked_slots || 0) - (d.reserved_slots || 0),
      departure_date: d.start_datetime, // Hỗ trợ tương thích ngược
      meeting_point_address: d.meeting_point, // Hỗ trợ tương thích ngược
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

    departure.available_slots = (departure.total_slots || 0) - (departure.booked_slots || 0) - (departure.reserved_slots || 0);
    departure.departure_date = departure.start_datetime;
    departure.meeting_point_address = departure.meeting_point;
    return departure;
  }

  /**
   * Cập nhật đợt khởi hành (Admin)
   * - Không cho sửa ngày nếu đã có booking
   * - Không cho giảm total_slots < booked + reserved
   * - Nếu đổi meeting_point: bắt buộc nhập lý do và lưu lịch sử DepartureChangeLog
   */
  async updateDeparture(departureId, updateData, adminUser = null) {
    const departure = await TourDeparture.findOne({ _id: departureId, deleted_at: null });
    if (!departure) {
      const error = new Error('Đợt khởi hành không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Không cho sửa ngày giờ nếu đã có booking
    const newDatetimeInput = updateData.start_datetime || updateData.departure_date;
    if (newDatetimeInput) {
      const newDatetime = new Date(newDatetimeInput);
      const currentDatetime = new Date(departure.start_datetime || departure.departure_date);
      if (newDatetime.getTime() !== currentDatetime.getTime() && departure.booked_slots > 0) {
        const error = new Error(
          'Không thể sửa ngày giờ bắt đầu tour khi đã có booking. Hãy hủy đợt này và tạo đợt mới'
        );
        error.statusCode = 400;
        throw error;
      }
      departure.start_datetime = newDatetime;
    }

    // Không cho giảm total_slots xuống thấp hơn booked + reserved
    if (updateData.total_slots !== undefined) {
      const minSlots = departure.booked_slots + departure.reserved_slots;
      if (Number(updateData.total_slots) < minSlots) {
        const error = new Error(
          `Tổng số chỗ không được nhỏ hơn ${minSlots} (đã đặt: ${departure.booked_slots}, giữ tạm: ${departure.reserved_slots})`
        );
        error.statusCode = 400;
        throw error;
      }
      departure.total_slots = Number(updateData.total_slots);
    }

    // Kiểm tra thay đổi địa điểm tập trung (meeting_point)
    const newMeetingPointInput = updateData.meeting_point !== undefined 
      ? updateData.meeting_point 
      : updateData.meeting_point_address;

    if (newMeetingPointInput !== undefined) {
      const oldMeetingPoint = (departure.meeting_point || departure.meeting_point_address || '').trim();
      const newMeetingPoint = (newMeetingPointInput || '').trim();

      if (newMeetingPoint !== oldMeetingPoint) {
        const changeReason = (updateData.meeting_point_change_reason || updateData.reason || '').trim();
        if (!changeReason) {
          const error = new Error('Bắt buộc phải nhập lý do khi thay đổi địa điểm tập trung');
          error.statusCode = 400;
          throw error;
        }

        // Lưu bản ghi lịch sử DepartureChangeLog
        const changeLog = new DepartureChangeLog({
          departure_id: departure._id,
          field: 'meeting_point',
          old_value: oldMeetingPoint || '(Chưa cấu hình)',
          new_value: newMeetingPoint,
          reason: changeReason,
          changed_by: adminUser?._id || null,
          changed_at: new Date(),
        });
        await changeLog.save();

        departure.meeting_point = newMeetingPoint;

        // Gửi email thông báo bất đồng bộ (fire-and-forget), không làm block request
        this._notifyCustomersAboutMeetingPointChange(
          departure,
          oldMeetingPoint || '(Chưa cấu hình)',
          newMeetingPoint,
          changeReason
        ).catch((err) =>
          console.error('[TourDepartureService] Gửi email thông báo thất bại:', err?.message)
        );
      }
    }

    await departure.save();

    const result = departure.toObject();
    result.available_slots = (departure.total_slots || 0) - (departure.booked_slots || 0) - (departure.reserved_slots || 0);
    result.departure_date = departure.start_datetime;
    result.meeting_point_address = departure.meeting_point;
    return result;
  }

  /**
   * Lấy danh sách lịch sử thay đổi của đợt khởi hành
   */
  async getChangeLogs(departureId) {
    const logs = await DepartureChangeLog.find({ departure_id: departureId })
      .sort({ changed_at: -1 })
      .populate('changed_by', 'full_name email')
      .lean();
    return logs;
  }

  /**
   * Helper gửi email thông báo cho khách hàng có booking hợp lệ khi đổi địa điểm tập trung
   * @private
   */
  async _notifyCustomersAboutMeetingPointChange(departure, oldMeetingPoint, newMeetingPoint, reason) {
    try {
      const tour = await Tour.findById(departure.product_id).select('title').lean();
      const tourTitle = tour?.title || 'Tour du lịch';

      // Tìm tất cả đơn hàng hợp lệ có chứa đợt khởi hành này
      const activeOrders = await Order.find({
        'items.departure_id': departure._id,
        order_status: { $in: ['PENDING_PAYMENT', 'DEPOSIT_CONFIRMED', 'CONFIRMED'] },
      }).lean();

      if (!activeOrders || activeOrders.length === 0) return;

      const dateStr = (departure.start_datetime || departure.departure_date)
        ? new Date(departure.start_datetime || departure.departure_date).toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      // Thu thập danh sách email duy nhất (không trùng lặp)
      const recipientsMap = new Map();

      for (const order of activeOrders) {
        if (order.customer_info?.email) {
          recipientsMap.set(order.customer_info.email.toLowerCase().trim(), {
            email: order.customer_info.email.trim(),
            name: order.customer_info.full_name || 'Quý khách',
          });
        }

        if (Array.isArray(order.booking_customers)) {
          for (const cust of order.booking_customers) {
            if (cust.email) {
              const custEmail = cust.email.toLowerCase().trim();
              if (!recipientsMap.has(custEmail)) {
                recipientsMap.set(custEmail, {
                  email: cust.email.trim(),
                  name: cust.full_name || 'Quý khách',
                });
              }
            }
          }
        }
      }

      // Gửi email cho từng khách hàng
      for (const recipient of recipientsMap.values()) {
        await emailService.sendMeetingPointChangeEmail(recipient.email, recipient.name, {
          tourTitle,
          departureDate: dateStr,
          oldMeetingPoint,
          newMeetingPoint,
          reason,
        });
      }
    } catch (error) {
      console.error('[TourDepartureService._notifyCustomersAboutMeetingPointChange] Lỗi:', error);
    }
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
