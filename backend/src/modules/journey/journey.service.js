const mongoose = require('mongoose');
const TourJourney = require('./tourJourney.model');
const JourneyStop = require('./journeyStop.model');
const JourneyLog = require('./journeyLog.model');
const Tour = require('../tour/tour.model');
const TourDeparture = require('../tour/tourDeparture.model');
const Order = require('../order/order.model');
const journeyNotificationService = require('./journeyNotification.service');
const { emitJourneyEvent } = require('./journeySocket.service');
const {
  VALID_CUSTOMER_ORDER_STATUSES,
  isJourneyAdmin,
  isAssignedGuide,
  canUserViewJourney,
  recalculateJourneyProgress,
  toLocalDateStr,
  getFallbackCoordsForTour,
  createHttpError,
} = require('./journey.helper');

function stripHtml(html = '') {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_STATUS_LABELS = {
  PENDING: 'Chưa đến',
  TRAVELLING: 'Đang di chuyển',
  VISITING: 'Đang tham quan',
  COMPLETED: 'Hoàn thành',
  SKIPPED: 'Đã bỏ qua',
};

class JourneyService {
  /**
   * Kiểm tra quyền thao tác hành trình: phải là hướng dẫn viên được phân công hoặc Admin
   */
  async _assertCanOperate(user, journey) {
    const admin = await isJourneyAdmin(user);
    const guide = isAssignedGuide(user, journey);
    if (!admin && !guide) {
      throw createHttpError(403, 'Bạn không được phân công phụ trách hành trình này.');
    }
    return { isAdmin: admin, isGuide: guide };
  }

  /**
   * Xây dựng danh sách stops mặc định từ lịch trình mẫu của Tour (không sửa Tour.itinerary)
   */
  buildDefaultStopsFromTour(tour, departure) {
    const baseCoords = getFallbackCoordsForTour(tour);
    const depStart = new Date(departure.start_datetime);
    const itinerary = Array.isArray(tour?.itinerary)
      ? [...tour.itinerary].sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];

    if (itinerary.length === 0) {
      const plannedStart = new Date(depStart);
      const plannedEnd = new Date(depStart.getTime() + 2 * 3600 * 1000);
      return [
        {
          name: tour?.destination_location || tour?.title || 'Điểm tham quan chính',
          description: `Điểm tập trung: ${departure.meeting_point}`,
          address: departure.meeting_point || tour?.destination_location || '',
          latitude: baseCoords.lat,
          longitude: baseCoords.lng,
          order: 0,
          day_number: 1,
          planned_start: plannedStart,
          planned_end: plannedEnd,
        },
      ];
    }

    return itinerary.map((item, idx) => {
      const dayStart = new Date(depStart.getTime() + idx * 24 * 3600 * 1000);
      const plannedStart = new Date(dayStart);
      if (idx > 0) plannedStart.setHours(8, 0, 0, 0);
      const plannedEnd = new Date(plannedStart.getTime() + 3 * 3600 * 1000);

      // Tạo độ lệch nhỏ cho từng điểm để hiển thị lộ trình rõ ràng trên bản đồ
      const latOffset = (idx % 3) * 0.012 - 0.006;
      const lngOffset = idx * 0.015;

      return {
        name: item.day_title || `Điểm tham quan ${idx + 1}`,
        description: stripHtml(item.description || '').slice(0, 950),
        address: idx === 0 ? departure.meeting_point || tour?.destination_location : tour?.destination_location || '',
        latitude: Number((baseCoords.lat + latOffset).toFixed(6)),
        longitude: Number((baseCoords.lng + lngOffset).toFixed(6)),
        order: idx,
        day_number: idx + 1,
        planned_start: plannedStart,
        planned_end: plannedEnd,
      };
    });
  }

  /**
   * Tự động chuẩn bị bản ghi TourJourney từ TourDeparture nếu chưa có
   * (Phục vụ xem lịch trình dự kiến trước ngày khởi hành)
   */
  async ensureJourneyForDeparture(departureId) {
    let existing = await TourJourney.findOne({ departure_id: departureId, deleted_at: null });
    if (existing) return existing;

    const departure = await TourDeparture.findOne({ _id: departureId, deleted_at: null }).lean();
    if (!departure) return null;

    const tour = await Tour.findOne({ _id: departure.product_id, deleted_at: null }).lean();
    if (!tour) return null;

    const initialStatus = departure.status === 'CANCELLED' ? 'CANCELLED' : 'NOT_STARTED';

    try {
      const journey = await TourJourney.create({
        departure_id: departure._id,
        tour_id: tour._id,
        guide_id: null,
        status: initialStatus,
        progress: 0,
        cancelled_at: initialStatus === 'CANCELLED' ? new Date() : null,
        cancel_reason: initialStatus === 'CANCELLED' ? 'Đợt khởi hành đã bị hủy' : '',
      });

      const defaultStops = this.buildDefaultStopsFromTour(tour, departure).map((s) => ({
        ...s,
        journey_id: journey._id,
      }));
      if (defaultStops.length > 0) {
        await JourneyStop.insertMany(defaultStops);
      }

      return journey;
    } catch (err) {
      // Trường hợp 2 request đồng thời tạo cùng 1 departure_id (unique index E11000)
      if (err.code === 11000) {
        return await TourJourney.findOne({ departure_id: departureId, deleted_at: null });
      }
      throw err;
    }
  }

  /**
   * Tính các chỉ số thống kê của hành trình từ danh sách stops
   */
  _buildStats(stops) {
    const totalStops = stops.length;
    const skippedStops = stops.filter((s) => s.status === 'SKIPPED').length;
    const completedStops = stops.filter((s) => s.status === 'COMPLETED').length;
    const activeTotal = totalStops - skippedStops;
    const currentStop =
      stops.find((s) => s.status === 'VISITING') ||
      stops.find((s) => s.status === 'TRAVELLING') ||
      stops.find((s) => s.status === 'PENDING') ||
      null;

    return {
      total_stops: totalStops,
      active_stops: activeTotal,
      completed_stops: completedStops,
      skipped_stops: skippedStops,
      current_stop_id: currentStop ? currentStop._id : null,
    };
  }

  /**
   * Lấy danh sách hành trình của khách hàng dựa trên các đơn đặt tour hợp lệ
   */
  async getCustomerJourneys(userId) {
    const orders = await Order.find({
      user_id: userId,
      order_status: { $in: VALID_CUSTOMER_ORDER_STATUSES },
    })
      .sort({ created_at: -1 })
      .lean();

    const departureIdsSet = new Set();
    const orderByDeparture = new Map();

    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.departure_id) {
          const depIdStr = item.departure_id.toString();
          departureIdsSet.add(depIdStr);
          if (!orderByDeparture.has(depIdStr)) {
            orderByDeparture.set(depIdStr, {
              order_id: order._id,
              order_code: order.order_code,
              order_status: order.order_status,
              quantity: item.quantity,
            });
          }
        }
      }
    }

    const departureIds = Array.from(departureIdsSet);
    if (departureIds.length === 0) return [];

    // Đảm bảo các đợt khởi hành đã đặt đều có bản ghi hành trình dự kiến
    await Promise.all(departureIds.map((depId) => this.ensureJourneyForDeparture(depId)));

    const journeys = await TourJourney.find({
      departure_id: { $in: departureIds },
      deleted_at: null,
    })
      .populate('tour_id', 'code title duration destination_location main_image')
      .populate('departure_id', 'start_datetime meeting_point total_slots booked_slots status')
      .populate('guide_id', 'full_name phone email avatar_url')
      .sort({ created_at: -1 })
      .lean();

    const journeyIds = journeys.map((j) => j._id);
    const allStops = await JourneyStop.find({ journey_id: { $in: journeyIds } })
      .sort({ order: 1 })
      .lean();

    const stopsByJourney = new Map();
    for (const stop of allStops) {
      const jId = stop.journey_id.toString();
      if (!stopsByJourney.has(jId)) stopsByJourney.set(jId, []);
      stopsByJourney.get(jId).push(stop);
    }

    const todayLocal = toLocalDateStr(new Date());

    return journeys.map((j) => {
      const stops = stopsByJourney.get(j._id.toString()) || [];
      const depDateStr = j.departure_id?.start_datetime
        ? toLocalDateStr(j.departure_id.start_datetime)
        : '';
      const isDepartureDayReached = depDateStr ? todayLocal >= depDateStr : false;

      return {
        ...j,
        order_info: orderByDeparture.get(j.departure_id?._id?.toString() || '') || null,
        stats: this._buildStats(stops),
        is_departure_day_reached: isDepartureDayReached,
      };
    });
  }

  /**
   * Lấy danh sách hành trình được phân công cho nhân viên hướng dẫn
   */
  async getAssignedJourneys(staffUser, queryParams = {}) {
    const { status, date, from_date, to_date, search, page = 1, limit = 20 } = queryParams;

    const filter = {
      guide_id: staffUser._id,
      deleted_at: null,
    };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const journeys = await TourJourney.find(filter)
      .populate('tour_id', 'code title duration destination_location main_image')
      .populate('departure_id', 'start_datetime meeting_point total_slots booked_slots status')
      .populate('guide_id', 'full_name phone email avatar_url')
      .sort({ created_at: -1 })
      .lean();

    const todayLocal = toLocalDateStr(new Date());

    let filtered = journeys.filter((j) => {
      if (!j.departure_id || !j.tour_id) return false;
      const depLocal = toLocalDateStr(j.departure_id.start_datetime);

      if (date && depLocal !== date) return false;
      if (from_date && depLocal < from_date) return false;
      if (to_date && depLocal > to_date) return false;

      if (search && search.trim()) {
        const kw = search.trim().toLowerCase();
        const matchTitle = j.tour_id.title?.toLowerCase().includes(kw);
        const matchCode = j.tour_id.code?.toLowerCase().includes(kw);
        const matchDest = j.tour_id.destination_location?.toLowerCase().includes(kw);
        if (!matchTitle && !matchCode && !matchDest) return false;
      }

      return true;
    });

    const total = filtered.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const paged = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const journeyIds = paged.map((j) => j._id);
    const allStops = await JourneyStop.find({ journey_id: { $in: journeyIds } })
      .sort({ order: 1 })
      .lean();

    const stopsByJourney = new Map();
    for (const s of allStops) {
      const k = s.journey_id.toString();
      if (!stopsByJourney.has(k)) stopsByJourney.set(k, []);
      stopsByJourney.get(k).push(s);
    }

    const items = paged.map((j) => {
      const stops = stopsByJourney.get(j._id.toString()) || [];
      const depLocal = toLocalDateStr(j.departure_id.start_datetime);
      return {
        ...j,
        stats: this._buildStats(stops),
        is_departure_day_reached: depLocal ? todayLocal >= depLocal : false,
      };
    });

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Lấy chi tiết một hành trình (kiểm tra chặt quyền xem ở backend)
   */
  async getJourneyDetail(journeyId, user) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null })
      .populate('tour_id', 'code title duration destination_location main_image')
      .populate('departure_id', 'start_datetime meeting_point total_slots booked_slots status')
      .populate('guide_id', 'full_name phone email avatar_url')
      .lean();

    if (!journey) {
      throw createHttpError(404, 'Hành trình không tồn tại');
    }

    const allowed = await canUserViewJourney(user, journey);
    if (!allowed) {
      throw createHttpError(403, 'Bạn không có quyền truy cập hành trình này');
    }

    const stops = await JourneyStop.find({ journey_id: journey._id })
      .populate('added_by', 'full_name')
      .sort({ order: 1 })
      .lean();

    const todayLocal = toLocalDateStr(new Date());
    const depDateStr = journey.departure_id?.start_datetime
      ? toLocalDateStr(journey.departure_id.start_datetime)
      : '';
    const isDepartureDayReached = depDateStr ? todayLocal >= depDateStr : false;

    const recentLogs = await JourneyLog.find({ journey_id: journey._id })
      .populate('performed_by', 'full_name roles')
      .populate('stop_id', 'name')
      .sort({ created_at: -1 })
      .limit(25)
      .lean();

    return {
      journey: {
        ...journey,
        is_departure_day_reached: isDepartureDayReached,
      },
      stops,
      stats: this._buildStats(stops),
      recent_logs: recentLogs,
    };
  }

  /**
   * Nhân viên hướng dẫn bấm "Bắt đầu hành trình"
   * - Chỉ cho phép từ ngày khởi hành địa phương (Asia/Ho_Chi_Minh)
   * - Điểm đầu tiên (chưa bị bỏ qua) tự động chuyển sang TRAVELLING
   */
  async startJourney(journeyId, actor, { version, note = '', io = null } = {}) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null }).populate('departure_id');
    if (!journey) {
      throw createHttpError(404, 'Hành trình không tồn tại');
    }

    const { isAdmin, isGuide } = await this._assertCanOperate(actor, journey);

    if (journey.status === 'CANCELLED') {
      throw createHttpError(400, 'Hành trình đã bị hủy, không thể bắt đầu');
    }
    if (journey.status !== 'NOT_STARTED') {
      throw createHttpError(400, 'Hành trình đã được bắt đầu hoặc đã kết thúc');
    }

    const todayLocal = toLocalDateStr(new Date());
    const depLocal = journey.departure_id?.start_datetime
      ? toLocalDateStr(journey.departure_id.start_datetime)
      : '';

    if (depLocal && todayLocal < depLocal) {
      throw createHttpError(
        400,
        `Chưa đến ngày khởi hành (${depLocal}). Chỉ có thể bắt đầu hành trình vào đúng ngày khởi hành.`
      );
    }

    const filter = { _id: journeyId, status: 'NOT_STARTED', deleted_at: null };
    if (version !== undefined && version !== null) {
      filter.version = Number(version);
    }

    const now = new Date();
    const updatedJourney = await TourJourney.findOneAndUpdate(
      filter,
      {
        $set: { status: 'IN_PROGRESS', started_at: now },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updatedJourney) {
      throw createHttpError(409, 'Hành trình đã được cập nhật bởi thao tác khác. Vui lòng tải lại dữ liệu.');
    }

    // Chuyển điểm đầu tiên hợp lệ (PENDING) sang Đang di chuyển (TRAVELLING)
    const firstStop = await JourneyStop.findOne({
      journey_id: journeyId,
      status: 'PENDING',
    }).sort({ order: 1 });

    let updatedFirstStop = null;
    if (firstStop) {
      updatedFirstStop = await JourneyStop.findOneAndUpdate(
        { _id: firstStop._id, status: 'PENDING' },
        { $set: { status: 'TRAVELLING', departed_at: now }, $inc: { version: 1 } },
        { new: true }
      ).lean();

      await JourneyLog.create({
        journey_id: journeyId,
        stop_id: firstStop._id,
        performed_by: actor._id,
        action: 'STOP_STATUS_CHANGED',
        old_value: { status: 'PENDING' },
        new_value: { status: 'TRAVELLING', departed_at: now },
        reason: 'Tự động chuyển khi bắt đầu hành trình',
        note,
      });
    }

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: null,
      performed_by: actor._id,
      action: !isGuide && isAdmin ? 'ADMIN_INTERVENTION' : 'JOURNEY_STARTED',
      old_value: { status: 'NOT_STARTED' },
      new_value: { status: 'IN_PROGRESS', started_at: now },
      reason: 'Nhân viên bắt đầu hành trình',
      note,
    });

    const { progress, stats } = await recalculateJourneyProgress(journeyId);

    // Sau khi lưu DB thành công mới phát Socket & tạo thông báo
    emitJourneyEvent(io, journeyId, 'journey:started', {
      status: 'IN_PROGRESS',
      started_at: now,
      progress,
      stats,
      firstStop: updatedFirstStop,
    });
    emitJourneyEvent(io, journeyId, 'journey:status_updated', {
      status: 'IN_PROGRESS',
      progress,
      stats,
    });
    if (updatedFirstStop) {
      emitJourneyEvent(io, journeyId, 'journey:stop_updated', {
        stop: updatedFirstStop,
        progress,
        stats,
      });
    }

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id._id || journey.departure_id,
      type: 'JOURNEY_STARTED',
      title: 'Hành trình đã bắt đầu',
      message: updatedFirstStop
        ? `Đoàn đã bắt đầu hành trình và đang di chuyển đến: ${updatedFirstStop.name}.`
        : 'Đoàn đã chính thức bắt đầu hành trình.',
      metadata: { started_at: now, stop_id: updatedFirstStop?._id || null },
    });

    return {
      journey: updatedJourney,
      first_stop: updatedFirstStop,
      progress,
      stats,
    };
  }

  /**
   * Cập nhật trạng thái một điểm dừng theo quy tắc State Machine + Concurrency Control
   * Hỗ trợ luồng ngoại lệ/chỉnh sửa nhầm với cờ `is_exception: true` và bắt buộc `reason`.
   */
  async updateStopStatus(
    journeyId,
    stopId,
    actor,
    { status: nextStatus, reason = '', note = '', version, is_exception = false, io = null }
  ) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) {
      throw createHttpError(404, 'Hành trình không tồn tại');
    }

    const { isAdmin, isGuide } = await this._assertCanOperate(actor, journey);

    if (journey.status !== 'IN_PROGRESS') {
      throw createHttpError(400, 'Hành trình chưa bắt đầu hoặc đã kết thúc/hủy');
    }

    const stop = await JourneyStop.findOne({ _id: stopId, journey_id: journeyId });
    if (!stop) {
      throw createHttpError(404, 'Điểm dừng không tồn tại trong hành trình này');
    }

    if (version !== undefined && version !== null && stop.version !== Number(version)) {
      throw createHttpError(
        409,
        'Trạng thái điểm dừng đã thay đổi bởi một thao tác khác. Vui lòng tải lại dữ liệu mới nhất.'
      );
    }

    const currentStatus = stop.status;
    if (currentStatus === nextStatus) {
      throw createHttpError(400, `Điểm dừng đang ở trạng thái ${STOP_STATUS_LABELS[nextStatus] || nextStatus}`);
    }

    const normalAllowed = {
      PENDING: ['TRAVELLING'],
      TRAVELLING: ['VISITING'],
      VISITING: ['COMPLETED'],
      COMPLETED: [],
      SKIPPED: [],
    };

    const isNormalTransition = (normalAllowed[currentStatus] || []).includes(nextStatus);

    if (!isNormalTransition) {
      if (!is_exception) {
        throw createHttpError(
          400,
          `Không thể chuyển trực tiếp từ "${STOP_STATUS_LABELS[currentStatus]}" sang "${STOP_STATUS_LABELS[nextStatus]}". Vui lòng thực hiện đúng trình tự hoặc dùng chế độ điều chỉnh ngoại lệ kèm lý do.`
        );
      }
      if (!reason || !reason.trim()) {
        throw createHttpError(400, 'Bắt buộc phải nhập lý do khi thực hiện chuyển trạng thái ngoại lệ / sửa nhầm');
      }
    }

    // Khi bắt đầu di chuyển đến điểm tiếp theo, kiểm tra không có điểm khác đang TRAVELLING hoặc VISITING (trừ ngoại lệ)
    if (nextStatus === 'TRAVELLING' && !is_exception) {
      const activeOther = await JourneyStop.findOne({
        journey_id: journeyId,
        _id: { $ne: stopId },
        status: { $in: ['TRAVELLING', 'VISITING'] },
      }).lean();

      if (activeOther) {
        throw createHttpError(
          400,
          `Địa điểm "${activeOther.name}" hiện đang "${STOP_STATUS_LABELS[activeOther.status]}". Vui lòng hoàn thành hoặc bỏ qua điểm đó trước khi di chuyển tiếp.`
        );
      }
    }

    const now = new Date();
    const updateSet = { status: nextStatus };
    if (note !== undefined && note !== '') updateSet.note = note.trim();

    if (nextStatus === 'TRAVELLING') {
      updateSet.departed_at = stop.departed_at || now;
    } else if (nextStatus === 'VISITING') {
      updateSet.departed_at = stop.departed_at || now;
      updateSet.arrived_at = now;
    } else if (nextStatus === 'COMPLETED') {
      updateSet.departed_at = stop.departed_at || now;
      updateSet.arrived_at = stop.arrived_at || now;
      updateSet.completed_at = now;
    } else if (nextStatus === 'PENDING') {
      updateSet.skipped_reason = '';
    }

    const updatedStop = await JourneyStop.findOneAndUpdate(
      { _id: stopId, journey_id: journeyId, version: stop.version, status: currentStatus },
      { $set: updateSet, $inc: { version: 1 } },
      { new: true }
    ).lean();

    if (!updatedStop) {
      throw createHttpError(409, 'Thao tác bị xung đột với cập nhật khác. Vui lòng tải lại dữ liệu.');
    }

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: stopId,
      performed_by: actor._id,
      action: !isGuide && isAdmin ? 'ADMIN_INTERVENTION' : 'STOP_STATUS_CHANGED',
      old_value: {
        status: currentStatus,
        arrived_at: stop.arrived_at,
        completed_at: stop.completed_at,
      },
      new_value: {
        status: nextStatus,
        arrived_at: updatedStop.arrived_at,
        completed_at: updatedStop.completed_at,
        is_exception: !!is_exception,
      },
      reason: reason.trim() || `Chuyển trạng thái sang ${STOP_STATUS_LABELS[nextStatus]}`,
      note: note.trim(),
    });

    const { progress, stats } = await recalculateJourneyProgress(journeyId);

    emitJourneyEvent(io, journeyId, 'journey:stop_updated', {
      stop: updatedStop,
      progress,
      stats,
    });
    emitJourneyEvent(io, journeyId, 'journey:status_updated', {
      status: journey.status,
      progress,
      stats,
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'STATUS_UPDATE',
      title: `Cập nhật địa điểm: ${updatedStop.name}`,
      message: `Địa điểm "${updatedStop.name}" đã chuyển sang trạng thái "${STOP_STATUS_LABELS[nextStatus]}".`,
      metadata: {
        stop_id: updatedStop._id,
        stop_name: updatedStop.name,
        old_status: currentStatus,
        new_status: nextStatus,
      },
    });

    return { stop: updatedStop, progress, stats };
  }

  /**
   * Kết thúc toàn bộ hành trình
   * - Không cho phép nếu còn điểm đang VISITING, TRAVELLING hoặc PENDING
   */
  async completeJourney(journeyId, actor, { reason = '', note = '', version, io = null } = {}) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) {
      throw createHttpError(404, 'Hành trình không tồn tại');
    }

    const { isAdmin, isGuide } = await this._assertCanOperate(actor, journey);

    if (journey.status !== 'IN_PROGRESS') {
      throw createHttpError(400, 'Chỉ có thể kết thúc hành trình đang diễn ra');
    }

    const stops = await JourneyStop.find({ journey_id: journeyId }).lean();
    const visitingOrTravelling = stops.filter((s) => ['VISITING', 'TRAVELLING'].includes(s.status));
    if (visitingOrTravelling.length > 0) {
      throw createHttpError(
        400,
        `Không thể kết thúc hành trình vì địa điểm "${visitingOrTravelling[0].name}" vẫn đang "${STOP_STATUS_LABELS[visitingOrTravelling[0].status]}".`
      );
    }

    const pendingStops = stops.filter((s) => s.status === 'PENDING');
    if (pendingStops.length > 0) {
      throw createHttpError(
        400,
        `Còn ${pendingStops.length} điểm dừng chưa thực hiện (${pendingStops[0].name}...). Vui lòng hoàn thành hoặc bỏ qua kèm lý do trước khi kết thúc hành trình.`
      );
    }

    const filter = { _id: journeyId, status: 'IN_PROGRESS', deleted_at: null };
    if (version !== undefined && version !== null) {
      filter.version = Number(version);
    }

    const now = new Date();
    const updatedJourney = await TourJourney.findOneAndUpdate(
      filter,
      { $set: { status: 'COMPLETED', completed_at: now }, $inc: { version: 1 } },
      { new: true }
    );

    if (!updatedJourney) {
      throw createHttpError(409, 'Hành trình đã được cập nhật bởi thao tác khác. Vui lòng tải lại dữ liệu.');
    }

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: null,
      performed_by: actor._id,
      action: !isGuide && isAdmin ? 'ADMIN_INTERVENTION' : 'JOURNEY_COMPLETED',
      old_value: { status: 'IN_PROGRESS' },
      new_value: { status: 'COMPLETED', completed_at: now },
      reason: reason.trim() || 'Nhân viên xác nhận hoàn thành toàn bộ hành trình',
      note: note.trim(),
    });

    const { progress, stats } = await recalculateJourneyProgress(journeyId);

    emitJourneyEvent(io, journeyId, 'journey:completed', {
      status: 'COMPLETED',
      completed_at: now,
      progress,
      stats,
    });
    emitJourneyEvent(io, journeyId, 'journey:status_updated', {
      status: 'COMPLETED',
      progress,
      stats,
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'JOURNEY_COMPLETED',
      title: 'Hành trình đã hoàn thành',
      message: 'Toàn bộ hành trình tham quan đã hoàn thành. Cảm ơn quý khách đã đồng hành cùng TourGo!',
      metadata: { completed_at: now },
    });

    return { journey: updatedJourney, progress, stats };
  }

  /**
   * Bỏ qua một điểm dừng (bắt buộc nhập lý do)
   */
  async skipStop(journeyId, stopId, actor, { reason, note = '', version, io = null }) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Bắt buộc phải nhập lý do khi bỏ qua địa điểm');
    }

    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    const { isAdmin, isGuide } = await this._assertCanOperate(actor, journey);

    if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
      throw createHttpError(400, 'Không thể điều chỉnh hành trình đã hoàn thành hoặc đã hủy');
    }

    const stop = await JourneyStop.findOne({ _id: stopId, journey_id: journeyId });
    if (!stop) throw createHttpError(404, 'Điểm dừng không tồn tại');

    if (version !== undefined && version !== null && stop.version !== Number(version)) {
      throw createHttpError(409, 'Dữ liệu điểm dừng đã thay đổi. Vui lòng tải lại.');
    }

    if (stop.status === 'COMPLETED') {
      throw createHttpError(400, 'Không thể bỏ qua địa điểm đã hoàn thành');
    }
    if (stop.status === 'SKIPPED') {
      throw createHttpError(400, 'Địa điểm này đã được bỏ qua trước đó');
    }

    const oldStatus = stop.status;
    const updatedStop = await JourneyStop.findOneAndUpdate(
      { _id: stopId, journey_id: journeyId, version: stop.version },
      {
        $set: {
          status: 'SKIPPED',
          skipped_reason: reason.trim(),
          ...(note ? { note: note.trim() } : {}),
        },
        $inc: { version: 1 },
      },
      { new: true }
    ).lean();

    if (!updatedStop) {
      throw createHttpError(409, 'Xung đột cập nhật. Vui lòng tải lại dữ liệu.');
    }

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: stopId,
      performed_by: actor._id,
      action: !isGuide && isAdmin ? 'ADMIN_INTERVENTION' : 'STOP_SKIPPED',
      old_value: { status: oldStatus },
      new_value: { status: 'SKIPPED', skipped_reason: reason.trim() },
      reason: reason.trim(),
      note: note.trim(),
    });

    const { progress, stats } = await recalculateJourneyProgress(journeyId);

    emitJourneyEvent(io, journeyId, 'journey:stop_updated', {
      stop: updatedStop,
      progress,
      stats,
    });
    emitJourneyEvent(io, journeyId, 'journey:schedule_changed', {
      changeType: 'STOP_SKIPPED',
      stop: updatedStop,
      reason: reason.trim(),
      progress,
      stats,
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'SCHEDULE_CHANGE',
      title: `Điều chỉnh lịch trình: Bỏ qua "${updatedStop.name}"`,
      message: `Địa điểm "${updatedStop.name}" đã được bỏ qua. Lý do: ${reason.trim()}`,
      metadata: { stop_id: updatedStop._id, reason: reason.trim() },
    });

    return { stop: updatedStop, progress, stats };
  }

  /**
   * Thêm địa điểm phát sinh vào hành trình thực tế (bắt buộc nhập lý do)
   */
  async addStop(
    journeyId,
    actor,
    {
      name,
      description = '',
      address = '',
      latitude,
      longitude,
      day_number = 1,
      planned_start = null,
      planned_end = null,
      insert_after_stop_id = null,
      reason,
      note = '',
      io = null,
    }
  ) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Bắt buộc phải nhập lý do khi thêm địa điểm phát sinh');
    }

    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    await this._assertCanOperate(actor, journey);

    if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
      throw createHttpError(400, 'Không thể thêm điểm vào hành trình đã kết thúc hoặc đã hủy');
    }

    const existingStops = await JourneyStop.find({ journey_id: journeyId }).sort({ order: 1 });

    let newOrder = existingStops.length;
    if (insert_after_stop_id) {
      const targetIdx = existingStops.findIndex((s) => s._id.toString() === insert_after_stop_id.toString());
      if (targetIdx !== -1) {
        newOrder = existingStops[targetIdx].order + 1;
        await JourneyStop.updateMany(
          { journey_id: journeyId, order: { $gte: newOrder } },
          { $inc: { order: 1, version: 1 } }
        );
      }
    }

    const createdStop = await JourneyStop.create({
      journey_id: journeyId,
      name: name.trim(),
      description: description.trim(),
      address: address.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      order: newOrder,
      day_number: Number(day_number) || 1,
      planned_start: planned_start ? new Date(planned_start) : null,
      planned_end: planned_end ? new Date(planned_end) : null,
      status: 'PENDING',
      is_additional: true,
      added_by: actor._id,
      note: note.trim(),
    });

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: createdStop._id,
      performed_by: actor._id,
      action: 'STOP_ADDED',
      old_value: null,
      new_value: {
        name: createdStop.name,
        address: createdStop.address,
        order: createdStop.order,
        latitude: createdStop.latitude,
        longitude: createdStop.longitude,
      },
      reason: reason.trim(),
      note: note.trim(),
    });

    const { progress, stats } = await recalculateJourneyProgress(journeyId);
    const stops = await JourneyStop.find({ journey_id: journeyId }).sort({ order: 1 }).lean();

    emitJourneyEvent(io, journeyId, 'journey:schedule_changed', {
      changeType: 'STOP_ADDED',
      stop: createdStop.toObject(),
      stops,
      reason: reason.trim(),
      progress,
      stats,
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'SCHEDULE_CHANGE',
      title: `Thêm điểm tham quan mới: ${createdStop.name}`,
      message: `Lịch trình vừa bổ sung địa điểm "${createdStop.name}". Lý do: ${reason.trim()}`,
      metadata: { stop_id: createdStop._id, reason: reason.trim() },
    });

    return { stop: createdStop, stops, progress, stats };
  }

  /**
   * Thay đổi thứ tự các điểm dừng (bắt buộc nhập lý do)
   */
  async reorderStops(journeyId, actor, { ordered_stop_ids, reason, note = '', version, io = null }) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Bắt buộc phải nhập lý do khi thay đổi thứ tự lịch trình');
    }

    if (!Array.isArray(ordered_stop_ids) || ordered_stop_ids.length === 0) {
      throw createHttpError(400, 'Danh sách thứ tự điểm dừng không hợp lệ');
    }

    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    await this._assertCanOperate(actor, journey);

    if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
      throw createHttpError(400, 'Không thể thay đổi thứ tự hành trình đã hoàn thành hoặc đã hủy');
    }

    const existingStops = await JourneyStop.find({ journey_id: journeyId }).sort({ order: 1 }).lean();
    const existingIdsSet = new Set(existingStops.map((s) => s._id.toString()));

    if (
      ordered_stop_ids.length !== existingStops.length ||
      ordered_stop_ids.some((id) => !existingIdsSet.has(id.toString()))
    ) {
      throw createHttpError(400, 'Danh sách điểm dừng không khớp với hành trình hiện tại');
    }

    const journeyFilter = { _id: journeyId, deleted_at: null };
    if (version !== undefined && version !== null) {
      journeyFilter.version = Number(version);
    }

    const bumpedJourney = await TourJourney.findOneAndUpdate(
      journeyFilter,
      { $inc: { version: 1 } },
      { new: true }
    );
    if (!bumpedJourney) {
      throw createHttpError(409, 'Hành trình vừa có thay đổi từ thao tác khác. Vui lòng tải lại.');
    }

    const oldOrderSnapshot = existingStops.map((s) => ({
      stop_id: s._id,
      name: s.name,
      order: s.order,
    }));

    const bulkOps = ordered_stop_ids.map((stopId, idx) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(stopId), journey_id: journey._id },
        update: { $set: { order: idx }, $inc: { version: 1 } },
      },
    }));
    await JourneyStop.bulkWrite(bulkOps);

    const updatedStops = await JourneyStop.find({ journey_id: journeyId }).sort({ order: 1 }).lean();
    const newOrderSnapshot = updatedStops.map((s) => ({
      stop_id: s._id,
      name: s.name,
      order: s.order,
    }));

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: null,
      performed_by: actor._id,
      action: 'STOP_REORDERED',
      old_value: oldOrderSnapshot,
      new_value: newOrderSnapshot,
      reason: reason.trim(),
      note: note.trim(),
    });

    emitJourneyEvent(io, journeyId, 'journey:schedule_changed', {
      changeType: 'STOP_REORDERED',
      stops: updatedStops,
      reason: reason.trim(),
      journeyVersion: bumpedJourney.version,
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'SCHEDULE_CHANGE',
      title: 'Cập nhật thứ tự các điểm tham quan',
      message: `Thứ tự các điểm tham quan đã được điều chỉnh. Lý do: ${reason.trim()}`,
      metadata: { reason: reason.trim() },
    });

    return { stops: updatedStops, journey_version: bumpedJourney.version };
  }

  /**
   * Điều chỉnh thời gian dự kiến của một điểm dừng (bắt buộc lý do)
   */
  async adjustStopTime(
    journeyId,
    stopId,
    actor,
    { planned_start, planned_end, reason, note = '', version, io = null }
  ) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Bắt buộc phải nhập lý do khi điều chỉnh thời gian dự kiến');
    }

    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    await this._assertCanOperate(actor, journey);

    if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
      throw createHttpError(400, 'Không thể điều chỉnh hành trình đã kết thúc hoặc đã hủy');
    }

    const stop = await JourneyStop.findOne({ _id: stopId, journey_id: journeyId });
    if (!stop) throw createHttpError(404, 'Điểm dừng không tồn tại');

    if (version !== undefined && version !== null && stop.version !== Number(version)) {
      throw createHttpError(409, 'Dữ liệu điểm dừng đã thay đổi. Vui lòng tải lại.');
    }

    const nextStart = planned_start !== undefined ? (planned_start ? new Date(planned_start) : null) : stop.planned_start;
    const nextEnd = planned_end !== undefined ? (planned_end ? new Date(planned_end) : null) : stop.planned_end;

    if (nextStart && nextEnd && nextEnd < nextStart) {
      throw createHttpError(400, 'Thời gian dự kiến kết thúc không được nhỏ hơn thời gian bắt đầu');
    }

    const oldVal = { planned_start: stop.planned_start, planned_end: stop.planned_end };
    const updatedStop = await JourneyStop.findOneAndUpdate(
      { _id: stopId, journey_id: journeyId, version: stop.version },
      {
        $set: {
          planned_start: nextStart,
          planned_end: nextEnd,
          ...(note ? { note: note.trim() } : {}),
        },
        $inc: { version: 1 },
      },
      { new: true }
    ).lean();

    if (!updatedStop) {
      throw createHttpError(409, 'Xung đột cập nhật. Vui lòng tải lại.');
    }

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: stopId,
      performed_by: actor._id,
      action: 'STOP_TIME_ADJUSTED',
      old_value: oldVal,
      new_value: { planned_start: nextStart, planned_end: nextEnd },
      reason: reason.trim(),
      note: note.trim(),
    });

    emitJourneyEvent(io, journeyId, 'journey:stop_updated', { stop: updatedStop });
    emitJourneyEvent(io, journeyId, 'journey:schedule_changed', {
      changeType: 'STOP_TIME_ADJUSTED',
      stop: updatedStop,
      reason: reason.trim(),
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'SCHEDULE_CHANGE',
      title: `Điều chỉnh giờ dự kiến: ${updatedStop.name}`,
      message: `Thời gian dự kiến tại "${updatedStop.name}" đã được điều chỉnh. Lý do: ${reason.trim()}`,
      metadata: { stop_id: updatedStop._id, planned_start: nextStart, planned_end: nextEnd },
    });

    return { stop: updatedStop };
  }

  /**
   * Ghi chú sự kiện bất thường hoặc lưu ý tại một điểm dừng
   */
  async updateStopNote(journeyId, stopId, actor, { note, reason = '', io = null }) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    await this._assertCanOperate(actor, journey);

    const stop = await JourneyStop.findOne({ _id: stopId, journey_id: journeyId });
    if (!stop) throw createHttpError(404, 'Điểm dừng không tồn tại');

    const oldNote = stop.note;
    stop.note = (note || '').trim();
    stop.version += 1;
    await stop.save();

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: stopId,
      performed_by: actor._id,
      action: 'STOP_NOTE_UPDATED',
      old_value: { note: oldNote },
      new_value: { note: stop.note },
      reason: reason.trim() || 'Cập nhật ghi chú điểm dừng',
      note: stop.note,
    });

    const stopObj = stop.toObject();
    emitJourneyEvent(io, journeyId, 'journey:stop_updated', { stop: stopObj });

    return { stop: stopObj };
  }
}

module.exports = new JourneyService();

