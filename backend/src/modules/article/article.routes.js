const express = require('express');
const router = express.Router();
const articleController = require('./article.controller');
const articleCategoryController = require('./articleCategory.controller');
const { listArticlesValidation } = require('./article.validation');

// Danh sách danh mục bài viết đang hoạt động
router.get('/categories', articleCategoryController.getActiveCategories);

// Danh sách bài viết nổi bật (theo lượt xem)
router.get('/featured', articleController.getFeaturedArticles);

// Danh sách bài viết đã xuất bản (phân trang, lọc theo danh mục, từ khóa tìm kiếm)
router.get('/', listArticlesValidation, articleController.getPublishedArticles);

// Chi tiết bài viết theo slug
router.get('/:slug', articleController.getArticleBySlug);

// Danh sách bài viết liên quan theo slug
router.get('/:slug/related', articleController.getRelatedArticles);

module.exports = router;
