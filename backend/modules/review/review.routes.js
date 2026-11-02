const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  getReviewsValidation,
  createReviewValidation,
} = require('./review.validation');

// Lấy danh sách đánh giá của Tour (Public)
router.get('/tour/:tourId', getReviewsValidation, reviewController.getTourReviews);

// Gửi đánh giá cho Tour (Yêu cầu đăng nhập)
router.post('/', authenticate, createReviewValidation, reviewController.createReview);

module.exports = router;

