const { validationResult } = require('express-validator');
const tourDepartureService = require('./tourDeparture.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Hàm helper kiểm tra và xử lý lỗi Validation từ express-validator
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
    return false;
  }
  return true;
};

// ============ PUBLIC CONTROLLERS — Khách hàng xem đợt khởi hành ============

/**
 * Controller: Lấy danh sách đợt khởi hành đang OPEN của 1 Tour
 * HTTP Method: GET /api/tours/:productId/departures/public
 */
const getPublicDepartures = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const departures = await tourDepartureService.getPublicDepartures(req.params.productId);
  ApiResponse.success(res, 200, 'Lấy danh sách đợt khởi hành thành công', departures);
});

/**
 * Controller: Lấy chi tiết đợt khởi hành theo ID
 * HTTP Method: GET /api/departures/:id
 */
const getDepartureById = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const departure = await tourDepartureService.getDepartureById(req.params.id);
  ApiResponse.success(res, 200, 'Lấy chi tiết đợt khởi hành thành công', departure);
});

// ============ ADMIN CONTROLLERS — Quản lý đợt khởi hành ============

/**
 * Controller: Tạo đợt khởi hành cho Tour (ADMIN)
 * HTTP Method: POST /api/tours/:productId/departures
 */
const createDeparture = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const departure = await tourDepartureService.createDeparture(req.params.productId, req.body);
  ApiResponse.success(res, 201, 'Tạo đợt khởi hành thành công', departure);
});

/**
 * Controller: Lấy danh sách đợt khởi hành (ADMIN — mọi trạng thái, phân trang)
 * HTTP Method: GET /api/tours/:productId/departures
 */
const getAllDepartures = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await tourDepartureService.getAllDepartures(req.params.productId, req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách đợt khởi hành thành công', result);
});

/**
 * Controller: Cập nhật đợt khởi hành (ADMIN)
 * HTTP Method: PATCH /api/departures/:id
 */
const updateDeparture = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const departure = await tourDepartureService.updateDeparture(req.params.id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật đợt khởi hành thành công', departure);
});

/**
 * Controller: Đổi trạng thái đợt khởi hành (ADMIN)
 * HTTP Method: PATCH /api/departures/:id/status
 */
const changeDepartureStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const departure = await tourDepartureService.changeStatus(req.params.id, req.body.status);
  ApiResponse.success(res, 200, 'Đổi trạng thái đợt khởi hành thành công', departure);
});

/**
 * Controller: Xóa mềm đợt khởi hành (ADMIN)
 * HTTP Method: DELETE /api/departures/:id
 */
const deleteDeparture = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await tourDepartureService.softDeleteDeparture(req.params.id);
  ApiResponse.success(res, 200, result.message, null);
});

module.exports = {
  getPublicDepartures,
  getDepartureById,
  createDeparture,
  getAllDepartures,
  updateDeparture,
  changeDepartureStatus,
  deleteDeparture,
};
