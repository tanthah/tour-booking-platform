const express = require('express');
const router = express.Router();
const tourController = require('./tour.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  createTourValidation,
  updateTourValidation,
  changeStatusValidation,
  tourIdValidation,
  listToursValidation,
} = require('./tour.validation');

// ============ PUBLIC ROUTES — Khách hàng xem Tour (không cần đăng nhập) ============

// Endpoint lấy danh sách Tour đã PUBLISHED (có phân trang, lọc, tìm kiếm)
router.get('/public', listToursValidation, tourController.getPublishedTours);

// Endpoint lấy chi tiết 1 Tour đã PUBLISHED theo ID
router.get('/public/:id', tourIdValidation, tourController.getPublishedTourDetail);

// ============ PROTECTED ROUTES — ADMIN/STAFF quản lý Tour (yêu cầu JWT + quyền) ============

// Endpoint lấy danh sách tất cả Tour (mọi trạng thái — dành cho quản lý)
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), listToursValidation, tourController.getAllTours);

// Endpoint tạo Tour mới
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), createTourValidation, tourController.createTour);

// Endpoint lấy chi tiết Tour theo ID (mọi trạng thái — dành cho quản lý)
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), tourIdValidation, tourController.getTourById);

// Endpoint cập nhật thông tin Tour
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateTourValidation, tourController.updateTour);

// Endpoint đổi trạng thái Tour
router.patch('/:id/status', authenticate, authorize('ADMIN', 'STAFF'), changeStatusValidation, tourController.changeStatus);

// Endpoint xóa mềm Tour
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), tourIdValidation, tourController.deleteTour);

module.exports = router;
