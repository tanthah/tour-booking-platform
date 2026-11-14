const express = require('express');
const router = express.Router();
const journeyController = require('./journey.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  journeyIdValidation,
  stopParamsValidation,
  notificationParamsValidation,
  startJourneyValidation,
  completeJourneyValidation,
  updateStopStatusValidation,
  skipStopValidation,
  addStopValidation,
  reorderStopsValidation,
  adjustStopTimeValidation,
  updateStopNoteValidation,
  listJourneysQueryValidation,
} = require('./journey.validation');

// Tất cả endpoints hành trình đều yêu cầu đăng nhập
router.use(authenticate);

// ============ ROUTES KHÁCH HÀNG & NHÂN VIÊN (Đặt trước /:journeyId) ============

// Danh sách hành trình của khách hàng hiện tại
router.get('/my', authorize('CUSTOMER', 'STAFF', 'ADMIN'), journeyController.getMyJourneys);

// Danh sách hành trình được phân công cho nhân viên hướng dẫn
router.get(
  '/assigned',
  authorize('STAFF', 'ADMIN'),
  listJourneysQueryValidation,
  validate,
  journeyController.getAssignedJourneys
);

// ============ ROUTES CHI TIẾT & THAO TÁC HÀNH TRÌNH ============

// Chi tiết hành trình + stops + tiến độ (backend kiểm tra quyền xem)
router.get('/:journeyId', journeyIdValidation, validate, journeyController.getJourneyDetail);

// Thông báo của hành trình
router.get(
  '/:journeyId/notifications',
  journeyIdValidation,
  validate,
  journeyController.getJourneyNotifications
);
router.patch(
  '/:journeyId/notifications/read-all',
  journeyIdValidation,
  validate,
  journeyController.markAllNotificationsRead
);
router.patch(
  '/:journeyId/notifications/:notifId/read',
  notificationParamsValidation,
  validate,
  journeyController.markNotificationRead
);

// Thao tác cập nhật hành trình (chỉ nhân viên được phân công hoặc Admin — kiểm tra ở backend service)
router.post(
  '/:journeyId/start',
  authorize('STAFF', 'ADMIN'),
  startJourneyValidation,
  validate,
  journeyController.startJourney
);

router.post(
  '/:journeyId/complete',
  authorize('STAFF', 'ADMIN'),
  completeJourneyValidation,
  validate,
  journeyController.completeJourney
);

// Điều chỉnh lịch trình & cập nhật trạng thái điểm dừng
router.post(
  '/:journeyId/stops',
  authorize('STAFF', 'ADMIN'),
  addStopValidation,
  validate,
  journeyController.addStop
);

router.patch(
  '/:journeyId/stops/reorder',
  authorize('STAFF', 'ADMIN'),
  reorderStopsValidation,
  validate,
  journeyController.reorderStops
);

router.patch(
  '/:journeyId/stops/:stopId/status',
  authorize('STAFF', 'ADMIN'),
  updateStopStatusValidation,
  validate,
  journeyController.updateStopStatus
);

router.patch(
  '/:journeyId/stops/:stopId/skip',
  authorize('STAFF', 'ADMIN'),
  skipStopValidation,
  validate,
  journeyController.skipStop
);

router.patch(
  '/:journeyId/stops/:stopId/time',
  authorize('STAFF', 'ADMIN'),
  adjustStopTimeValidation,
  validate,
  journeyController.adjustStopTime
);

router.patch(
  '/:journeyId/stops/:stopId/note',
  authorize('STAFF', 'ADMIN'),
  updateStopNoteValidation,
  validate,
  journeyController.updateStopNote
);

module.exports = router;

