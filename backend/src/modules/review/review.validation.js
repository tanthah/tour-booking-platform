const { body, param, query } = require('express-validator');

const getReviewsValidation = [
  param('tourId')
    .isMongoId()
    .withMessage('ID Tour không hợp lệ'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Số lượng mỗi trang từ 1 đến 50'),

  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Số sao lọc từ 1 đến 5'),
];

const createReviewValidation = [
  body('tour_id')
    .notEmpty()
    .withMessage('Tour ID là bắt buộc')
    .isMongoId()
    .withMessage('Tour ID không hợp lệ'),

  body('rating')
    .notEmpty()
    .withMessage('Số sao đánh giá là bắt buộc')
    .isInt({ min: 1, max: 5 })
    .withMessage('Số sao phải từ 1 đến 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Nội dung đánh giá không quá 2000 ký tự'),

  body('order_id')
    .optional()
    .isMongoId()
    .withMessage('Order ID không hợp lệ'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Danh sách ảnh phải là mảng URL'),
];

module.exports = {
  getReviewsValidation,
  createReviewValidation,
};

