const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const journeyAdminService = require('./journeyAdmin.service');
const journeyService = require('./journey.service');

/**
 * GET /api/admin/journeys — Danh sách tất cả hành trình cho Admin giám sát
 */
const listAllJourneys = asyncHandler(async (req, res) => {
  const result = await journeyAdminService.listAllJourneys(req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách hành trình thành công', result);
});

/**
 * GET /api/admin/journeys/available-departures — Đợt khởi hành chưa có hành trình
 */
const getAvailableDepartures = asyncHandler(async (req, res) => {
  const items = await journeyAdminService.getAvailableDepartures();
  return ApiResponse.success(res, 200, 'Lấy danh sách đợt khởi hành khả dụng thành công', items);
});

/**
 * GET /api/admin/journeys/guides — Danh sách nhân viên có thể phân công làm hướng dẫn viên
 */
const getAvailableGuides = asyncHandler(async (req, res) => {
  const guides = await journeyAdminService.getAvailableGuides();
  return ApiResponse.success(res, 200, 'Lấy danh sách nhân viên hướng dẫn thành công', guides);
});

/**
 * GET /api/admin/journeys/:journeyId — Chi tiết hành trình + stops + recent logs
 */
const getJourneyDetailAdmin = asyncHandler(async (req, res) => {
  const result = await journeyService.getJourneyDetail(req.params.journeyId, req.user);
  return ApiResponse.success(res, 200, 'Lấy chi tiết hành trình thành công', result);
});

/**
 * GET /api/admin/journeys/:journeyId/logs — Lịch sử thao tác & điều chỉnh
 */
const getJourneyLogs = asyncHandler(async (req, res) => {
  const result = await journeyAdminService.getJourneyLogs(req.params.journeyId, req.query);
  return ApiResponse.success(res, 200, 'Lấy lịch sử hành trình thành công', result);
});

/**
 * POST /api/admin/journeys/create — Admin tạo hành trình cho một TourDeparture
 */
const createJourney = asyncHandler(async (req, res) => {
  const result = await journeyAdminService.createJourney({
    departure_id: req.body.departure_id,
    guide_id: req.body.guide_id || null,
    stops: req.body.stops || null,
    actor: req.user,
    reqMeta: { ip: req.ip, userAgent: req.get('user-agent') || '' },
  });
  return ApiResponse.success(res, 201, 'Khởi tạo hành trình thành công', result);
});

/**
 * PATCH /api/admin/journeys/:journeyId/assign-guide — Phân công / thay đổi nhân viên hướng dẫn
 */
const assignGuide = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyAdminService.assignGuide({
    journeyId: req.params.journeyId,
    guide_id: req.body.guide_id || null,
    reason: req.body.reason || '',
    actor: req.user,
    reqMeta: { ip: req.ip, userAgent: req.get('user-agent') || '' },
    io,
  });
  return ApiResponse.success(res, 200, 'Phân công nhân viên hướng dẫn thành công', result);
});

/**
 * PATCH /api/admin/journeys/:journeyId/cancel — Admin hủy hành trình
 */
const cancelJourney = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await journeyAdminService.cancelJourney({
    journeyId: req.params.journeyId,
    reason: req.body.reason,
    actor: req.user,
    reqMeta: { ip: req.ip, userAgent: req.get('user-agent') || '' },
    io,
  });
  return ApiResponse.success(res, 200, 'Đã hủy hành trình thành công', result);
});

module.exports = {
  listAllJourneys,
  getAvailableDepartures,
  getAvailableGuides,
  getJourneyDetailAdmin,
  getJourneyLogs,
  createJourney,
  assignGuide,
  cancelJourney,
};

