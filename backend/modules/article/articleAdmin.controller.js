const { validationResult } = require('express-validator');
const articleAdminService = require('./articleAdmin.service');
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

// Lấy danh sách bài viết trong hàng đợi chờ duyệt
const getReviewQueue = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await articleAdminService.getReviewQueue(req.query);
  ApiResponse.success(res, 200, 'Lấy hàng đợi duyệt bài thành công', result);
});

// Gửi bài viết sang hàng đợi duyệt
const submitForReview = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.submitForReview(req.params.id, req.user._id);
  ApiResponse.success(res, 200, 'Gửi duyệt bài viết thành công', article);
});

// Phê duyệt bài viết
const approveArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.approveArticle(
    req.params.id,
    req.user._id,
    req.body.comment
  );
  ApiResponse.success(res, 200, 'Phê duyệt bài viết thành công', article);
});

// Yêu cầu tác giả chỉnh sửa bài viết
const requestChanges = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.requestChanges(
    req.params.id,
    req.user._id,
    req.body.comment
  );
  ApiResponse.success(res, 200, 'Đã gửi yêu cầu chỉnh sửa bài viết', article);
});

// Xuất bản bài viết
const publishArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.publishArticle(req.params.id, req.user._id);
  ApiResponse.success(res, 200, 'Xuất bản bài viết thành công', article);
});

// Lưu trữ bài viết
const archiveArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.archiveArticle(req.params.id, req.user._id);
  ApiResponse.success(res, 200, 'Lưu trữ bài viết thành công', article);
});

// Phân công người viết bài
const assignArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.assignArticle(
    req.params.id,
    req.body.assigned_to,
    req.user._id,
    req.body.note
  );
  ApiResponse.success(res, 200, 'Phân công nhân viên phụ trách thành công', article);
});

// Hủy phân công người viết bài
const unassignArticle = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const article = await articleAdminService.unassignArticle(req.params.id, req.user._id);
  ApiResponse.success(res, 200, 'Hủy phân công nhân viên thành công', article);
});

// Lấy lịch sử xét duyệt bài viết
const getReviewHistory = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const history = await articleAdminService.getReviewHistory(req.params.id);
  ApiResponse.success(res, 200, 'Lấy lịch sử duyệt bài thành công', history);
});

module.exports = {
  getReviewQueue,
  submitForReview,
  approveArticle,
  requestChanges,
  publishArticle,
  archiveArticle,
  assignArticle,
  unassignArticle,
  getReviewHistory,
};
