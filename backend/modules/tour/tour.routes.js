const express = require('express');
const router = express.Router();
const tourController = require('./tour.controller');
const departureController = require('./tourDeparture.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  createTourValidation,
  updateTourValidation,
  changeStatusValidation,
  tourIdValidation,
  listToursValidation,
} = require('./tour.validation');
const {
  createDepartureValidation,
  updateDepartureValidation,
  changeDepartureStatusValidation,
  departureIdValidation,
  listDeparturesValidation,
} = require('./tourDeparture.validation');

// ============ PUBLIC ROUTES — Khách hàng xem Tour ============

// Lấy danh sách Tour đang ACTIVE (phân trang, lọc, tìm kiếm)
router.get('/public', listToursValidation, tourController.getPublishedTours);

// Lấy chi tiết 1 Tour đang ACTIVE theo ID
router.get('/public/:id', tourIdValidation, tourController.getPublishedTourDetail);

// Lấy danh sách đợt khởi hành đang OPEN của 1 Tour (Public)
router.get('/:productId/departures/public', listDeparturesValidation, departureController.getPublicDepartures);

// ============ PROTECTED ROUTES — ADMIN quản lý Tour ============

// Lấy danh sách tất cả Tour (mọi trạng thái)
router.get('/', authenticate, requirePermission(PERMISSIONS.TOUR_VIEW), listToursValidation, tourController.getAllTours);

// Tạo Tour mới
router.post('/', authenticate, requirePermission(PERMISSIONS.TOUR_CREATE), createTourValidation, tourController.createTour);

// Lấy chi tiết Tour theo ID (mọi trạng thái)
router.get('/:id', authenticate, requirePermission(PERMISSIONS.TOUR_VIEW), tourIdValidation, tourController.getTourById);

// Cập nhật thông tin Tour
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.TOUR_UPDATE), updateTourValidation, tourController.updateTour);

// Đổi trạng thái Tour
router.patch('/:id/status', authenticate, requirePermission(PERMISSIONS.TOUR_UPDATE), changeStatusValidation, tourController.changeStatus);

// Xóa mềm Tour
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.TOUR_DELETE), tourIdValidation, tourController.deleteTour);

// ============ PROTECTED ROUTES — ADMIN quản lý Đợt khởi hành ============

// Lấy danh sách đợt khởi hành của Tour (Admin — mọi trạng thái)
router.get('/:productId/departures', authenticate, requirePermission(PERMISSIONS.SCHEDULE_VIEW), listDeparturesValidation, departureController.getAllDepartures);

// Tạo đợt khởi hành cho Tour
router.post('/:productId/departures', authenticate, requirePermission(PERMISSIONS.SCHEDULE_CREATE), createDepartureValidation, departureController.createDeparture);

module.exports = router;
