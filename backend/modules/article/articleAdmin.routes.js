const express = require('express');
const router = express.Router();
const articleController = require('./article.controller');
const articleAdminController = require('./articleAdmin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  createArticleValidation,
  updateArticleValidation,
  requestChangesValidation,
  assignValidation,
  idParamValidation,
  listArticlesValidation,
} = require('./article.validation');

// Mọi thao tác quản trị bài viết đều yêu cầu đã đăng nhập
router.use(authenticate);

// 1. Lấy danh sách hàng đợi duyệt bài: GET /api/admin/articles/review-queue
router.get(
  '/review-queue',
  requirePermission(PERMISSIONS.ARTICLE_REVIEW),
  articleAdminController.getReviewQueue
);

// 2. Lấy danh sách bài viết quản trị: GET /api/admin/articles
router.get(
  '/',
  requirePermission(PERMISSIONS.ARTICLE_VIEW),
  listArticlesValidation,
  articleController.getAdminArticles
);

// 3. Lấy chi tiết bài viết: GET /api/admin/articles/:id
router.get(
  '/:id',
  requirePermission(PERMISSIONS.ARTICLE_VIEW),
  idParamValidation,
  articleController.getAdminArticleById
);

// 4. Lấy lịch sử duyệt bài: GET /api/admin/articles/:id/history
router.get(
  '/:id/history',
  requirePermission(PERMISSIONS.ARTICLE_VIEW),
  idParamValidation,
  articleAdminController.getReviewHistory
);

// 5. Tạo bài viết mới: POST /api/admin/articles
router.post(
  '/',
  requirePermission(PERMISSIONS.ARTICLE_CREATE),
  createArticleValidation,
  articleController.createArticle
);

// 6. Cập nhật bài viết: PUT /api/admin/articles/:id
router.put(
  '/:id',
  requirePermission(PERMISSIONS.ARTICLE_UPDATE),
  updateArticleValidation,
  articleController.updateArticle
);

// 7. Gửi duyệt bài viết: POST /api/admin/articles/:id/submit
router.post(
  '/:id/submit',
  requirePermission(PERMISSIONS.ARTICLE_UPDATE),
  idParamValidation,
  articleAdminController.submitForReview
);

// 8. Phê duyệt bài viết: POST /api/admin/articles/:id/approve
router.post(
  '/:id/approve',
  requirePermission(PERMISSIONS.ARTICLE_REVIEW),
  idParamValidation,
  articleAdminController.approveArticle
);

// 9. Yêu cầu chỉnh sửa bài viết: POST /api/admin/articles/:id/request-changes
router.post(
  '/:id/request-changes',
  requirePermission(PERMISSIONS.ARTICLE_REVIEW),
  requestChangesValidation,
  articleAdminController.requestChanges
);

// 10. Xuất bản bài viết: POST /api/admin/articles/:id/publish
router.post(
  '/:id/publish',
  requirePermission(PERMISSIONS.ARTICLE_PUBLISH),
  idParamValidation,
  articleAdminController.publishArticle
);

// 11. Bật/tắt trạng thái xuất bản (legacy / toggle): PATCH /api/admin/articles/:id/publish
router.patch(
  '/:id/publish',
  requirePermission(PERMISSIONS.ARTICLE_PUBLISH),
  idParamValidation,
  articleController.togglePublishStatus
);

// 12. Lưu trữ bài viết: POST /api/admin/articles/:id/archive
router.post(
  '/:id/archive',
  requirePermission(PERMISSIONS.ARTICLE_MANAGE),
  idParamValidation,
  articleAdminController.archiveArticle
);

// 13. Phân công người viết: POST /api/admin/articles/:id/assign
router.post(
  '/:id/assign',
  requirePermission(PERMISSIONS.ARTICLE_MANAGE),
  assignValidation,
  articleAdminController.assignArticle
);

// 14. Hủy phân công: DELETE /api/admin/articles/:id/assign
router.delete(
  '/:id/assign',
  requirePermission(PERMISSIONS.ARTICLE_MANAGE),
  idParamValidation,
  articleAdminController.unassignArticle
);

// 15. Xóa bài viết: DELETE /api/admin/articles/:id
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.ARTICLE_MANAGE),
  idParamValidation,
  articleController.deleteArticle
);

module.exports = router;
