const { validationResult } = require('express-validator');
const articleService = require('./article.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
    return false;
  }
  return true;
};

// ==================== ADMIN CONTROLLERS ====================

const createArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleService.createArticle(req.body, req.user._id);
  ApiResponse.success(res, 201, 'Tạo bài viết thành công', article);
});

const updateArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleService.updateArticle(req.params.id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật bài viết thành công', article);
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleService.togglePublishStatus(req.params.id, req.body.publish);
  const msg = article.status === 'PUBLISHED' ? 'Xuất bản bài viết thành công' : 'Chuyển bài viết về bản nháp';
  ApiResponse.success(res, 200, msg, article);
});

const getAdminArticles = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await articleService.getAdminArticles(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách bài viết thành công', result);
});

const getAdminArticleById = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleService.getAdminArticleById(req.params.id);
  ApiResponse.success(res, 200, 'Lấy chi tiết bài viết thành công', article);
});

const deleteArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  await articleService.deleteArticle(req.params.id);
  ApiResponse.success(res, 200, 'Xóa bài viết thành công');
});

// ==================== PUBLIC CONTROLLERS ====================

const getPublishedArticles = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await articleService.getPublishedArticles(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách bài viết thành công', result);
});

const getFeaturedArticles = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 5;
  const articles = await articleService.getFeaturedArticles(limit);
  ApiResponse.success(res, 200, 'Lấy bài viết nổi bật thành công', articles);
});

const getArticleBySlug = asyncHandler(async (req, res) => {
  const article = await articleService.getArticleBySlug(req.params.slug);
  ApiResponse.success(res, 200, 'Lấy bài viết thành công', article);
});

const getRelatedArticles = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 4;
  const articles = await articleService.getRelatedArticles(req.params.slug, limit);
  ApiResponse.success(res, 200, 'Lấy bài viết liên quan thành công', articles);
});

module.exports = {
  createArticle,
  updateArticle,
  togglePublishStatus,
  getAdminArticles,
  getAdminArticleById,
  deleteArticle,
  getPublishedArticles,
  getFeaturedArticles,
  getArticleBySlug,
  getRelatedArticles,
};
