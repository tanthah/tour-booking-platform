const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middlewares/auth.middleware');
const requirePermission = require('../../../middlewares/requirePermission');
const validate = require('../../../middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../utils/permissionCodes');
const souvenirCardController = require('../controllers/souvenirCard.controller');
const {
  createCardValidation,
  updateCardValidation,
} = require('../validations/souvenir.validation');

router.use(authenticate);

// Tạo 1 thiệp cho khách
router.post(
  '/cards',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_CREATE),
  createCardValidation,
  validate,
  souvenirCardController.createCard
);

// Tạo thiệp hàng loạt cho toàn bộ khách trong album
router.post(
  '/albums/:albumId/cards/batch',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_CREATE),
  souvenirCardController.batchCreateCards
);

// Chi tiết thiệp
router.get(
  '/cards/:cardId',
  requirePermission([PERMISSIONS.SOUVENIR_CARD_VIEW, PERMISSIONS.SOUVENIR_CARD_UPDATE]),
  souvenirCardController.getCardDetail
);

// Cập nhật thiệp (DRAFT / REVISION_REQUESTED)
router.put(
  '/cards/:cardId',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_UPDATE),
  updateCardValidation,
  validate,
  souvenirCardController.updateCard
);

// Xem trước thiệp
router.get(
  '/cards/:cardId/preview',
  requirePermission([PERMISSIONS.SOUVENIR_CARD_PREVIEW, PERMISSIONS.SOUVENIR_CARD_VIEW]),
  souvenirCardController.previewCard
);

// Danh sách thiệp theo Album
router.get(
  '/albums/:albumId/cards',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_VIEW),
  souvenirCardController.getAlbumCards
);

// Gửi duyệt 1 thiệp
router.post(
  '/cards/:cardId/submit-review',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_SUBMIT_REVIEW),
  souvenirCardController.submitReview
);

// Gửi duyệt hàng loạt
router.post(
  '/albums/:albumId/cards/submit-review',
  requirePermission(PERMISSIONS.SOUVENIR_CARD_SUBMIT_REVIEW),
  souvenirCardController.batchSubmitReview
);

module.exports = router;

