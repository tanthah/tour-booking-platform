const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middlewares/auth.middleware');
const requirePermission = require('../../../middlewares/requirePermission');
const validate = require('../../../middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../utils/permissionCodes');
const cardAdminController = require('../controllers/cardAdmin.controller');
const cardEmailController = require('../controllers/cardEmail.controller');
const {
  adminReviewValidation,
  adminRevisionValidation,
  adminRevokeValidation,
} = require('../validations/souvenir.validation');

router.use(authenticate);

// Danh sách thiệp chờ duyệt
router.get(
  '/admin/pending-reviews',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_REVIEW),
  cardAdminController.getPendingReviews
);

// Duyệt thiệp
router.post(
  '/cards/:cardId/approve',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_REVIEW),
  adminReviewValidation,
  validate,
  cardAdminController.approveCard
);

// Yêu cầu chỉnh sửa thiệp
router.post(
  '/cards/:cardId/request-revision',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_REVIEW),
  adminRevisionValidation,
  validate,
  cardAdminController.requestRevision
);

// Phát hành 1 thiệp
router.post(
  '/cards/:cardId/publish',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_PUBLISH),
  cardAdminController.publishCard
);

// Phát hành hàng loạt thiệp đã APPROVED trong album
router.post(
  '/albums/:albumId/cards/publish',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_PUBLISH),
  cardAdminController.batchPublish
);

// Thu hồi thiệp
router.post(
  '/cards/:cardId/revoke',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_REVOKE),
  adminRevokeValidation,
  validate,
  cardAdminController.revokeCard
);

// Gửi lại email thông báo
router.post(
  '/cards/:cardId/resend-email',
  requirePermission(PERMISSIONS.SOUVENIR_EMAIL_RESEND),
  cardEmailController.resendCardEmail
);

// Lịch sử gửi email
router.get(
  '/cards/:cardId/email-logs',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_VIEW),
  cardEmailController.getCardEmailLogs
);

module.exports = router;

