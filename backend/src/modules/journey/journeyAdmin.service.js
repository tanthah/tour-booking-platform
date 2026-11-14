const TourJourney = require('./tourJourney.model');
const JourneyStop = require('./journeyStop.model');
const JourneyLog = require('./journeyLog.model');
const TourDeparture = require('../tour/tourDeparture.model');
const Tour = require('../tour/tour.model');
const User = require('../user/user.model');
const Role = require('../role/role.model');
const auditLogService = require('../audit/auditLog.service');
const journeyService = require('./journey.service');
const journeyNotificationService = require('./journeyNotification.service');
const { emitJourneyEvent } = require('./journeySocket.service');
const { toLocalDateStr, createHttpError } = require('./journey.helper');

class JourneyAdminService {
  /**
   * Danh sách toàn bộ hành trình cho Admin giám sát, lọc theo tour, ngày, guide, trạng thái
   */
  async listAllJourneys(queryParams = {}) {
    const {
      tour_id,
      guide_id,
      status,
      date,
      from_date,
      to_date,
      search,
      attention_only,
      page = 1,
      limit = 20,
    } = queryParams;

    const filter = { deleted_at: null };
    if (tour_id) filter.tour_id = tour_id;
    if (guide_id) filter.guide_id = guide_id;
    if (status && status !== 'ALL') filter.status = status;

    const journeys = await TourJourney.find(filter)
      .populate('tour_id', 'code title duration destination_location main_image')
      .populate('departure_id', 'start_datetime meeting_point total_slots booked_slots status')
      .populate('guide_id', 'full_name phone email avatar_url')
      .sort({ created_at: -1 })
      .lean();

    const journeyIds = journeys.map((j) => j._id);
    const [allStops, changeCounts] = await Promise.all([
      JourneyStop.find({ journey_id: { $in: journeyIds } }).sort({ order: 1 }).lean(),
      JourneyLog.aggregate([
        {
          $match: {
            journey_id: { $in: journeyIds },
            action: { $in: ['STOP_SKIPPED', 'STOP_ADDED', 'STOP_REORDERED', 'STOP_TIME_ADJUSTED', 'ADMIN_INTERVENTION'] },
          },
        },
        { $group: { _id: '$journey_id', count: { $sum: 1 } } },
      ]),
    ]);

    const stopsMap = new Map();
    for (const s of allStops) {
      const k = s.journey_id.toString();
      if (!stopsMap.has(k)) stopsMap.set(k, []);
      stopsMap.get(k).push(s);
    }

    const changeCountMap = new Map();
    for (const c of changeCounts) {
      changeCountMap.set(c._id.toString(), c.count);
    }

    const todayLocal = toLocalDateStr(new Date());
    const nowMs = Date.now();

    const enriched = journeys
      .filter((j) => j.tour_id && j.departure_id)
      .map((j) => {
        const stops = stopsMap.get(j._id.toString()) || [];
        const depLocal = toLocalDateStr(j.departure_id.start_datetime);
        const scheduleChangesCount = changeCountMap.get(j._id.toString()) || 0;

        // Cờ cảnh báo giám sát (chưa bắt đầu khi đã đến/qua ngày, kéo dài > 48h, hoặc có điều chỉnh bất thường)
        const notStartedOnDay = j.status === 'NOT_STARTED' && depLocal && todayLocal >= depLocal;
        const longRunning =
          j.status === 'IN_PROGRESS' &&
          j.started_at &&
          nowMs - new Date(j.started_at).getTime() > 72 * 3600 * 1000;
        const hasAbnormalChanges = scheduleChangesCount > 0;

        return {
          ...j,
          stats: journeyService._buildStats(stops),
          schedule_changes_count: scheduleChangesCount,
          alerts: {
            not_started_on_day: notStartedOnDay,
            long_running: longRunning,
            has_schedule_changes: hasAbnormalChanges,
            needs_attention: notStartedOnDay || longRunning || !j.guide_id,
          },
        };
      })
      .filter((j) => {
        const depLocal = toLocalDateStr(j.departure_id.start_datetime);
        if (date && depLocal !== date) return false;
        if (from_date && depLocal < from_date) return false;
        if (to_date && depLocal > to_date) return false;

        if (attention_only === 'true' || attention_only === true) {
          if (!j.alerts.needs_attention && !j.alerts.has_schedule_changes) return false;
        }

        if (search && search.trim()) {
          const kw = search.trim().toLowerCase();
          const matchTour = j.tour_id.title?.toLowerCase().includes(kw) || j.tour_id.code?.toLowerCase().includes(kw);
          const matchGuide = j.guide_id?.full_name?.toLowerCase().includes(kw);
          if (!matchTour && !matchGuide) return false;
        }

        return true;
      });

    const total = enriched.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const items = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

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
   * Lấy toàn bộ lịch sử cập nhật (JourneyLog) của một hành trình
   */
  async getJourneyLogs(journeyId, queryParams = {}) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null }).lean();
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    const { action, page = 1, limit = 50 } = queryParams;
    const filter = { journey_id: journeyId };
    if (action) filter.action = action;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      JourneyLog.find(filter)
        .populate('performed_by', 'full_name email roles')
        .populate('stop_id', 'name order')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JourneyLog.countDocuments(filter),
    ]);

    return {
      items: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Admin tạo hành trình cho một TourDeparture
   */
  async createJourney({ departure_id, guide_id = null, stops = null, actor, reqMeta = {} }) {
    const departure = await TourDeparture.findOne({ _id: departure_id, deleted_at: null });
    if (!departure) {
      throw createHttpError(404, 'Đợt khởi hành không tồn tại');
    }

    const existing = await TourJourney.findOne({ departure_id, deleted_at: null });
    if (existing) {
      throw createHttpError(409, 'Đợt khởi hành này đã có bản ghi hành trình');
    }

    const tour = await Tour.findOne({ _id: departure.product_id, deleted_at: null }).lean();
    if (!tour) {
      throw createHttpError(404, 'Tour của đợt khởi hành không tồn tại');
    }

    if (guide_id) {
      const guideUser = await User.findOne({ _id: guide_id, deleted_at: null, status: 'ACTIVE' });
      if (!guideUser) {
        throw createHttpError(404, 'Nhân viên hướng dẫn được chọn không tồn tại hoặc không hoạt động');
      }
    }

    const journey = await TourJourney.create({
      departure_id: departure._id,
      tour_id: tour._id,
      guide_id: guide_id || null,
      status: departure.status === 'CANCELLED' ? 'CANCELLED' : 'NOT_STARTED',
      progress: 0,
    });

    const stopsToInsert =
      Array.isArray(stops) && stops.length > 0
        ? stops.map((s, idx) => ({
            journey_id: journey._id,
            name: s.name?.trim(),
            description: (s.description || '').trim(),
            address: (s.address || '').trim(),
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            order: idx,
            day_number: Number(s.day_number) || 1,
            planned_start: s.planned_start ? new Date(s.planned_start) : null,
            planned_end: s.planned_end ? new Date(s.planned_end) : null,
          }))
        : journeyService.buildDefaultStopsFromTour(tour, departure).map((s) => ({
            ...s,
            journey_id: journey._id,
          }));

    const createdStops = stopsToInsert.length > 0 ? await JourneyStop.insertMany(stopsToInsert) : [];

    await JourneyLog.create({
      journey_id: journey._id,
      stop_id: null,
      performed_by: actor._id,
      action: 'JOURNEY_CREATED',
      old_value: null,
      new_value: { departure_id: departure._id, guide_id: guide_id || null, stops_count: createdStops.length },
      reason: 'Admin khởi tạo hành trình thực tế',
    });

    if (guide_id) {
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: null,
        performed_by: actor._id,
        action: 'GUIDE_ASSIGNED',
        old_value: { guide_id: null },
        new_value: { guide_id },
        reason: 'Phân công hướng dẫn viên khi tạo hành trình',
      });
    }

    await auditLogService.log({
      actor_user_id: actor._id,
      target_user_id: guide_id || null,
      action: 'CREATE_JOURNEY',
      resource: 'TourJourney',
      old_value: null,
      new_value: { journey_id: journey._id, departure_id, guide_id },
      reason: 'Khởi tạo hành trình tour',
      ip_address: reqMeta.ip || '',
      user_agent: reqMeta.userAgent || '',
    });

    return { journey, stops: createdStops };
  }

  /**
   * Admin phân công hoặc thay đổi nhân viên hướng dẫn cho hành trình
   */
  async assignGuide({ journeyId, guide_id, reason = '', actor, reqMeta = {}, io = null }) {
    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
      throw createHttpError(400, 'Không thể phân công hướng dẫn viên cho hành trình đã kết thúc hoặc đã hủy');
    }

    let guideUser = null;
    if (guide_id) {
      guideUser = await User.findOne({ _id: guide_id, deleted_at: null }).populate('role_id');
      if (!guideUser || guideUser.status !== 'ACTIVE') {
        throw createHttpError(400, 'Nhân viên hướng dẫn không tồn tại hoặc tài khoản đang bị khóa');
      }
      const roleCode = guideUser.role_id?.code?.toLowerCase() || '';
      const isStaffOrAdmin =
        roleCode === 'admin' ||
        roleCode.includes('staff') ||
        (Array.isArray(guideUser.roles) &&
          (guideUser.roles.includes('STAFF') || guideUser.roles.includes('ADMIN')));
      if (!isStaffOrAdmin) {
        throw createHttpError(400, 'Người dùng được phân công phải là nhân viên hoặc quản trị viên');
      }
    }

    const oldGuideId = journey.guide_id;
    journey.guide_id = guide_id || null;
    journey.version += 1;
    await journey.save();

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: null,
      performed_by: actor._id,
      action: oldGuideId ? 'GUIDE_CHANGED' : 'GUIDE_ASSIGNED',
      old_value: { guide_id: oldGuideId },
      new_value: { guide_id: guide_id || null, guide_name: guideUser?.full_name || null },
      reason: reason.trim() || 'Admin phân công nhân viên hướng dẫn',
    });

    await auditLogService.log({
      actor_user_id: actor._id,
      target_user_id: guide_id || null,
      action: oldGuideId ? 'CHANGE_JOURNEY_GUIDE' : 'ASSIGN_JOURNEY_GUIDE',
      resource: 'TourJourney',
      old_value: { guide_id: oldGuideId },
      new_value: { guide_id: guide_id || null },
      reason: reason.trim() || 'Phân công hướng dẫn viên',
      ip_address: reqMeta.ip || '',
      user_agent: reqMeta.userAgent || '',
    });

    const populated = await TourJourney.findById(journeyId)
      .populate('guide_id', 'full_name phone email avatar_url')
      .lean();

    emitJourneyEvent(io, journeyId, 'journey:status_updated', {
      guide: populated.guide_id,
      status: populated.status,
    });

    return populated;
  }

  /**
   * Admin hủy hành trình (hoặc đồng bộ khi đợt khởi hành bị hủy)
   */
  async cancelJourney({ journeyId, reason, actor, reqMeta = {}, io = null }) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Bắt buộc phải nhập lý do khi hủy hành trình');
    }

    const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null });
    if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');

    if (journey.status === 'COMPLETED') {
      throw createHttpError(400, 'Không thể hủy hành trình đã hoàn thành');
    }
    if (journey.status === 'CANCELLED') {
      throw createHttpError(400, 'Hành trình đã bị hủy trước đó');
    }

    const oldStatus = journey.status;
    const now = new Date();
    journey.status = 'CANCELLED';
    journey.cancelled_at = now;
    journey.cancel_reason = reason.trim();
    journey.version += 1;
    await journey.save();

    await JourneyLog.create({
      journey_id: journeyId,
      stop_id: null,
      performed_by: actor._id,
      action: 'JOURNEY_CANCELLED',
      old_value: { status: oldStatus },
      new_value: { status: 'CANCELLED', cancelled_at: now },
      reason: reason.trim(),
    });

    await auditLogService.log({
      actor_user_id: actor._id,
      action: 'CANCEL_JOURNEY',
      resource: 'TourJourney',
      old_value: { journey_id: journeyId, status: oldStatus },
      new_value: { journey_id: journeyId, status: 'CANCELLED' },
      reason: reason.trim(),
      ip_address: reqMeta.ip || '',
      user_agent: reqMeta.userAgent || '',
    });

    emitJourneyEvent(io, journeyId, 'journey:status_updated', {
      status: 'CANCELLED',
      cancelled_at: now,
      cancel_reason: reason.trim(),
    });

    await journeyNotificationService.createAndBroadcast({
      io,
      journeyId,
      departureId: journey.departure_id,
      type: 'JOURNEY_CANCELLED',
      title: 'Hành trình đã bị hủy',
      message: `Hành trình tour đã bị hủy. Lý do: ${reason.trim()}`,
      metadata: { reason: reason.trim(), cancelled_at: now },
    });

    return journey;
  }

  /**
   * Đồng bộ hủy hành trình khi TourDeparture chuyển sang CANCELLED
   */
  async syncCancelByDeparture(departureId, actorId = null, reason = 'Đợt khởi hành đã bị hủy') {
    const journey = await TourJourney.findOne({
      departure_id: departureId,
      deleted_at: null,
      status: { $in: ['NOT_STARTED', 'IN_PROGRESS'] },
    });
    if (!journey) return null;

    const oldStatus = journey.status;
    journey.status = 'CANCELLED';
    journey.cancelled_at = new Date();
    journey.cancel_reason = reason;
    journey.version += 1;
    await journey.save();

    if (actorId) {
      await JourneyLog.create({
        journey_id: journey._id,
        stop_id: null,
        performed_by: actorId,
        action: 'JOURNEY_CANCELLED',
        old_value: { status: oldStatus },
        new_value: { status: 'CANCELLED' },
        reason,
      });
    }
    return journey;
  }

  /**
   * Danh sách các đợt khởi hành chưa có hành trình để Admin tạo mới
   */
  async getAvailableDepartures() {
    const existingJourneys = await TourJourney.find({ deleted_at: null }).select('departure_id').lean();
    const usedIds = existingJourneys.map((j) => j.departure_id);

    const departures = await TourDeparture.find({
      _id: { $nin: usedIds },
      deleted_at: null,
      status: { $ne: 'CANCELLED' },
    })
      .populate('product_id', 'code title duration destination_location itinerary main_image')
      .sort({ start_datetime: 1 })
      .limit(100)
      .lean();

    return departures.filter((d) => d.product_id);
  }

  /**
   * Danh sách nhân viên (STAFF / ADMIN) hoạt động để phân công hướng dẫn viên
   */
  async getAvailableGuides() {
    const staffRoles = await Role.find({
      code: { $in: ['admin', 'tour_staff', 'staff'] },
      is_active: true,
    })
      .select('_id')
      .lean();
    const staffRoleIds = staffRoles.map((r) => r._id);

    return User.find({
      deleted_at: null,
      status: 'ACTIVE',
      $or: [
        { roles: { $in: ['STAFF', 'ADMIN'] } },
        ...(staffRoleIds.length > 0 ? [{ role_id: { $in: staffRoleIds } }] : []),
      ],
    })
      .populate('role_id', 'code name')
      .select('full_name email phone avatar_url roles role_id')
      .sort({ full_name: 1 })
      .lean();
  }
}

module.exports = new JourneyAdminService();

