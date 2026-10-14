const express = require('express');
const router = express.Router();
const departureController = require('./tourDeparture.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  updateDepartureValidation,
  changeDepartureStatusValidation,
  departureIdValidation,
} = require('./tourDeparture.validation');

// ============ PUBLIC ROUTES ============

// Lấy chi tiết đợt khởi hành theo ID
router.get('/:id', departureIdValidation, departureController.getDepartureById);

// ============ PROTECTED ROUTES — ADMIN quản lý đợt khởi hành ============

// Cập nhật đợt khởi hành
router.patch('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateDepartureValidation, departureController.updateDeparture);

// Đổi trạng thái đợt khởi hành
router.patch('/:id/status', authenticate, authorize('ADMIN', 'STAFF'), changeDepartureStatusValidation, departureController.changeDepartureStatus);

// Xóa mềm đợt khởi hành
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), departureIdValidation, departureController.deleteDeparture);

module.exports = router;
