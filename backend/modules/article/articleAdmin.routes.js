const express = require('express');
const router = express.Router();
const articleController = require('./article.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  createArticleValidation,
  updateArticleValidation,
  idParamValidation,
  listArticlesValidation,
} = require('./article.validation');

// Tạm thời bảo vệ toàn bộ endpoints quản lý bài viết chỉ cho Admin
router.use(authenticate, authorize('ADMIN'));

// Lấy danh sách bài viết quản trị
router.get('/', listArticlesValidation, articleController.getAdminArticles);

// Lấy chi tiết bài viết quản trị
router.get('/:id', idParamValidation, articleController.getAdminArticleById);

// Tạo bài viết mới
router.post('/', createArticleValidation, articleController.createArticle);

// Cập nhật nội dung bài viết
router.put('/:id', updateArticleValidation, articleController.updateArticle);

// Xuất bản hoặc hủy xuất bản bài viết
router.patch('/:id/publish', idParamValidation, articleController.togglePublishStatus);

// Xóa bài viết
router.delete('/:id', idParamValidation, articleController.deleteArticle);

module.exports = router;
