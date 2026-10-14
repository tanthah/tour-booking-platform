const express = require('express');
const router = express.Router();
const tourController = require('./tour.controller');
const departureController = require('./tourDeparture.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
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
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), listToursValidation, tourController.getAllTours);

// Tạo Tour mới
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), createTourValidation, tourController.createTour);

// Lấy chi tiết Tour theo ID (mọi trạng thái)
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), tourIdValidation, tourController.getTourById);

// Cập nhật thông tin Tour
router.patch('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateTourValidation, tourController.updateTour);

// Đổi trạng thái Tour
router.patch('/:id/status', authenticate, authorize('ADMIN', 'STAFF'), changeStatusValidation, tourController.changeStatus);

// Xóa mềm Tour
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), tourIdValidation, tourController.deleteTour);

// ============ PROTECTED ROUTES — ADMIN quản lý Đợt khởi hành ============

// Lấy danh sách đợt khởi hành của Tour (Admin — mọi trạng thái)
router.get('/:productId/departures', authenticate, authorize('ADMIN', 'STAFF'), listDeparturesValidation, departureController.getAllDepartures);

// Tạo đợt khởi hành cho Tour
router.post('/:productId/departures', authenticate, authorize('ADMIN', 'STAFF'), createDepartureValidation, departureController.createDeparture);

module.exports = router;
