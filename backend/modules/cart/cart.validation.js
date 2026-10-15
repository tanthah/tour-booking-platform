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
  body('quantity_adult')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng người lớn phải là số nguyên từ 1 đến 50'),
  body('quantity_child')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Số lượng trẻ em phải là số nguyên từ 0 đến 50'),
  body('quantity_baby')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Số lượng em bé phải là số nguyên từ 0 đến 50'),
  body('departure_id')
    .optional({ values: 'falsy' })
    .isMongoId().withMessage('Đợt khởi hành ID không hợp lệ'),
];

/**
 * Validation: Cập nhật số lượng item trong giỏ hàng
 * Params: itemId (ID của item trong giỏ)
 * Body: quantity hoặc quantity_adult/quantity_child/quantity_baby
 */
const updateItemValidation = [
  param('itemId')
    .notEmpty().withMessage('Item ID là bắt buộc')
    .isMongoId().withMessage('Item ID không hợp lệ'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng phải là số nguyên từ 1 đến 50'),
  body('quantity_adult')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng người lớn phải là số nguyên từ 1 đến 50'),
  body('quantity_child')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Số lượng trẻ em phải là số nguyên từ 0 đến 50'),
  body('quantity_baby')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Số lượng em bé phải là số nguyên từ 0 đến 50'),
  body().custom((value, { req }) => {
    const { quantity, quantity_adult, quantity_child, quantity_baby } = req.body;
    if (
      quantity === undefined &&
      quantity_adult === undefined &&
      quantity_child === undefined &&
      quantity_baby === undefined
    ) {
      throw new Error('Cần cung cấp ít nhất một thông tin số lượng để cập nhật');
    }
    return true;
  }),
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
