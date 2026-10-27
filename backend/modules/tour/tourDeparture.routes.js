const express = require('express');
const router = express.Router();
const departureController = require('./tourDeparture.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
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
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.SCHEDULE_UPDATE), updateDepartureValidation, departureController.updateDeparture);

// Đổi trạng thái đợt khởi hành
router.patch('/:id/status', authenticate, requirePermission(PERMISSIONS.SCHEDULE_UPDATE), changeDepartureStatusValidation, departureController.changeDepartureStatus);

// Xóa mềm đợt khởi hành
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.SCHEDULE_DELETE), departureIdValidation, departureController.deleteDeparture);

module.exports = router;
