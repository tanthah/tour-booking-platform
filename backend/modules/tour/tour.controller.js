const { validationResult } = require('express-validator');
const tourService = require('./tour.service');
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

// ============ PUBLIC CONTROLLERS — Khách hàng xem Tour ============

/**
 * Controller: Lấy danh sách Tour đang ACTIVE (có phân trang, lọc, tìm kiếm, sắp xếp)
 * HTTP Method: GET /api/tours/public
 */
const getPublishedTours = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await tourService.getPublishedTours(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách Tour thành công', result);
});

/**
 * Controller: Lấy chi tiết Tour đang ACTIVE theo ID (dành cho Khách hàng)
 * HTTP Method: GET /api/tours/public/:id
 */
const getPublishedTourDetail = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const tour = await tourService.getPublishedTourById(req.params.id);
  ApiResponse.success(res, 200, 'Lấy chi tiết Tour thành công', tour);
});

// ============ ADMIN CONTROLLERS — Quản lý Tour ============

/**
 * Controller: Tạo Tour mới (ADMIN)
 * HTTP Method: POST /api/tours
 */
const createTour = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const tour = await tourService.createTour(req.body);
  ApiResponse.success(res, 201, 'Tạo Tour thành công', tour);
});

/**
 * Controller: Lấy danh sách tất cả Tour (ADMIN — mọi trạng thái)
 * HTTP Method: GET /api/tours
 */
const getAllTours = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await tourService.getAllTours(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách Tour thành công', result);
});

/**
 * Controller: Lấy chi tiết Tour theo ID (ADMIN — mọi trạng thái)
 * HTTP Method: GET /api/tours/:id
 */
const getTourById = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const tour = await tourService.getTourById(req.params.id);
  ApiResponse.success(res, 200, 'Lấy chi tiết Tour thành công', tour);
});

/**
 * Controller: Cập nhật thông tin Tour (ADMIN)
 * HTTP Method: PATCH /api/tours/:id
 */
const updateTour = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const tour = await tourService.updateTour(req.params.id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật Tour thành công', tour);
});

/**
 * Controller: Đổi trạng thái Tour (ADMIN)
 * HTTP Method: PATCH /api/tours/:id/status
 */
const changeStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const tour = await tourService.changeStatus(req.params.id, req.body.status);
  ApiResponse.success(res, 200, 'Đổi trạng thái Tour thành công', tour);
});

/**
 * Controller: Xóa mềm Tour (ADMIN)
 * HTTP Method: DELETE /api/tours/:id
 */
const deleteTour = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await tourService.softDeleteTour(req.params.id);
  ApiResponse.success(res, 200, result.message, null);
});

module.exports = {
  getPublishedTours,
  getPublishedTourDetail,
  createTour,
  getAllTours,
  getTourById,
  updateTour,
  changeStatus,
  deleteTour,
};
