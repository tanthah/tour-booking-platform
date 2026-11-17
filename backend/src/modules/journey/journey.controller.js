const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const journeyService = require('./journey.service');
const journeyNotificationService = require('./journeyNotification.service');
const TourJourney = require('./tourJourney.model');
const { canUserViewJourney, createHttpError } = require('./journey.helper');

/**
 * GET /api/journeys/my — Danh sách hành trình của khách hàng hiện tại
 */
const getMyJourneys = asyncHandler(async (req, res) => {
  const journeys = await journeyService.getCustomerJourneys(req.user._id);
  return ApiResponse.success(res, 200, 'Lấy danh sách hành trình thành công', journeys);
});

/**
 * GET /api/journeys/assigned — Danh sách hành trình được phân công cho nhân viên
 */
const getAssignedJourneys = asyncHandler(async (req, res) => {
  const result = await journeyService.getAssignedJourneys(req.user, req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách hành trình được phân công thành công', result);
});

/**
 * GET /api/journeys/:journeyId — Chi tiết hành trình + danh sách điểm + tiến độ
 */
const getJourneyDetail = asyncHandler(async (req, res) => {
  const result = await journeyService.getJourneyDetail(req.params.journeyId, req.user);
  return ApiResponse.success(res, 200, 'Lấy chi tiết hành trình thành công', result);
});

/**
 * GET /api/journeys/:journeyId/notifications — Thông báo của hành trình cho user
 */
const getJourneyNotifications = asyncHandler(async (req, res) => {
  const journey = await TourJourney.findOne({ _id: req.params.journeyId, deleted_at: null }).lean();
  if (!journey) throw createHttpError(404, 'Hành trình không tồn tại');
  const allowed = await canUserViewJourney(req.user, journey);
  if (!allowed) throw createHttpError(403, 'Bạn không có quyền truy cập hành trình này');

  const notifications = await journeyNotificationService.getUserJourneyNotifications(
    req.params.journeyId,
    req.user._id,
    req.query.limit
  );
  return ApiResponse.success(res, 200, 'Lấy thông báo hành trình thành công', notifications);
});

/**
 * PATCH /api/journeys/:journeyId/notifications/:notifId/read — Đánh dấu đã đọc 1 thông báo
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notif = await journeyNotificationService.markAsRead(
    req.params.journeyId,
    req.params.notifId,
    req.user._id
  );
  if (!notif) throw createHttpError(404, 'Thông báo không tồn tại');
  return ApiResponse.success(res, 200, 'Đã đánh dấu đã đọc', notif);
});

/**
 * PATCH /api/journeys/:journeyId/notifications/read-all — Đánh dấu đọc tất cả thông báo
 */
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await journeyNotificationService.markAllAsRead(req.params.journeyId, req.user._id);
  return ApiResponse.success(res, 200, 'Đã đánh dấu đọc toàn bộ thông báo', result);
});

/**
 * POST /api/journeys/:journeyId/start — Bắt đầu hành trình (Guide/Admin)
 */
const startJourney = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.startJourney(req.params.journeyId, req.user, {
    version: req.body.version,
    note: req.body.note,
    io,
  });
  return ApiResponse.success(res, 200, 'Đã bắt đầu hành trình thành công', result);
});

/**
 * POST /api/journeys/:journeyId/complete — Kết thúc hành trình (Guide/Admin)
 */
const completeJourney = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.completeJourney(req.params.journeyId, req.user, {
    version: req.body.version,
    reason: req.body.reason,
    note: req.body.note,
    io,
  });
  return ApiResponse.success(res, 200, 'Đã hoàn thành hành trình thành công', result);
});

/**
 * PATCH /api/journeys/:journeyId/stops/:stopId/status — Cập nhật trạng thái điểm dừng
 */
const updateStopStatus = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.updateStopStatus(req.params.journeyId, req.params.stopId, req.user, {
    status: req.body.status,
    reason: req.body.reason,
    note: req.body.note,
    version: req.body.version,
    is_exception: req.body.is_exception,
    io,
  });
  return ApiResponse.success(res, 200, 'Cập nhật trạng thái điểm dừng thành công', result);
});

/**
 * PATCH /api/journeys/:journeyId/stops/:stopId/skip — Bỏ qua điểm dừng (bắt buộc lý do)
 */
const skipStop = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.skipStop(req.params.journeyId, req.params.stopId, req.user, {
    reason: req.body.reason,
    note: req.body.note,
    version: req.body.version,
    io,
  });
  return ApiResponse.success(res, 200, 'Đã bỏ qua điểm dừng', result);
});

/**
 * POST /api/journeys/:journeyId/stops — Thêm điểm phát sinh (bắt buộc lý do)
 */
const addStop = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.addStop(req.params.journeyId, req.user, {
    ...req.body,
    io,
  });
  return ApiResponse.success(res, 201, 'Đã thêm điểm dừng phát sinh thành công', result);
});

/**
 * PATCH /api/journeys/:journeyId/stops/reorder — Thay đổi thứ tự các điểm (bắt buộc lý do)
 */
const reorderStops = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.reorderStops(req.params.journeyId, req.user, {
    ordered_stop_ids: req.body.ordered_stop_ids,
    reason: req.body.reason,
    note: req.body.note,
    version: req.body.version,
    io,
  });
  return ApiResponse.success(res, 200, 'Đã cập nhật thứ tự lịch trình thành công', result);
});

/**
 * PATCH /api/journeys/:journeyId/stops/:stopId/time — Điều chỉnh thời gian dự kiến (bắt buộc lý do)
 */
const adjustStopTime = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.adjustStopTime(req.params.journeyId, req.params.stopId, req.user, {
    planned_start: req.body.planned_start,
    planned_end: req.body.planned_end,
    reason: req.body.reason,
    note: req.body.note,
    version: req.body.version,
    io,
  });
  return ApiResponse.success(res, 200, 'Đã điều chỉnh thời gian dự kiến thành công', result);
});

/**
 * PATCH /api/journeys/:journeyId/stops/:stopId/note — Cập nhật ghi chú điểm dừng
 */
const updateStopNote = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyService.updateStopNote(req.params.journeyId, req.params.stopId, req.user, {
    note: req.body.note,
    reason: req.body.reason,
    io,
  });
  return ApiResponse.success(res, 200, 'Đã cập nhật ghi chú', result);
});

module.exports = {
  getMyJourneys,
  getAssignedJourneys,
  getJourneyDetail,
  getJourneyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  startJourney,
  completeJourney,
  updateStopStatus,
  skipStop,
  addStop,
  reorderStops,
  adjustStopTime,
  updateStopNote,
};

