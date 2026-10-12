const { body, param } = require('express-validator');

/**
 * Validation: Thêm tour vào giỏ hàng
 * Body: tour_id (bắt buộc), quantity (tùy chọn, mặc định 1)
 */
const addItemValidation = [
  body('tour_id')
    .notEmpty().withMessage('Tour ID là bắt buộc')
    .isMongoId().withMessage('Tour ID không hợp lệ'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng phải là số nguyên từ 1 đến 50'),
];

/**
 * Validation: Cập nhật số lượng item trong giỏ hàng
 * Params: itemId (ID của item trong giỏ)
 * Body: quantity (bắt buộc)
 */
const updateItemValidation = [
  param('itemId')
    .notEmpty().withMessage('Item ID là bắt buộc')
    .isMongoId().withMessage('Item ID không hợp lệ'),
  body('quantity')
    .notEmpty().withMessage('Số lượng là bắt buộc')
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng phải là số nguyên từ 1 đến 50'),
];

/**
 * Validation: Xóa item khỏi giỏ hàng
 * Params: itemId (ID của item trong giỏ)
 */
const removeItemValidation = [
  param('itemId')
    .notEmpty().withMessage('Item ID là bắt buộc')
    .isMongoId().withMessage('Item ID không hợp lệ'),
];

module.exports = {
  addItemValidation,
  updateItemValidation,
  removeItemValidation,
};
