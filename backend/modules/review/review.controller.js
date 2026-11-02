const { validationResult } = require('express-validator');
const reviewService = require('./review.service');
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

/**
 * Controller: Lấy danh sách đánh giá của 1 Tour
 * GET /api/reviews/tour/:tourId
 */
const getTourReviews = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await reviewService.getReviewsByTour(req.params.tourId, req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách đánh giá thành công', result);
});

/**
 * Controller: Tạo đánh giá mới
 * POST /api/reviews
 */
const createReview = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const review = await reviewService.createReview(req.user._id, req.body);
  ApiResponse.success(res, 201, 'Gửi đánh giá thành công', review);
});

module.exports = {
  getTourReviews,
  createReview,
};

