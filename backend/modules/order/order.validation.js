const { body, param, query } = require('express-validator');

/**
 * Validation: Checkout — Tạo đơn hàng từ giỏ hàng
 * Body gồm: customer_info, items (danh sách item_id từ giỏ), booking_customers, payment_method
 */
const checkoutValidation = [
  // Thông tin người đặt
  body('customer_info')
    .notEmpty().withMessage('Thông tin người đặt là bắt buộc')
    .isObject().withMessage('customer_info phải là object'),
  body('customer_info.full_name')
    .notEmpty().withMessage('Họ tên người đặt là bắt buộc')
    .isString().withMessage('Họ tên phải là chuỗi')
    .isLength({ max: 255 }).withMessage('Họ tên không quá 255 ký tự'),
  body('customer_info.phone')
    .notEmpty().withMessage('Số điện thoại người đặt là bắt buộc')
    .isString().withMessage('Số điện thoại phải là chuỗi'),
  body('customer_info.email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Email không hợp lệ'),
  body('customer_info.note')
    .optional()
    .isString().withMessage('Ghi chú phải là chuỗi')
    .isLength({ max: 1000 }).withMessage('Ghi chú không quá 1000 ký tự'),

  // Danh sách cart item IDs được chọn để checkout
  body('selected_items')
    .isArray({ min: 1 }).withMessage('Phải chọn ít nhất 1 tour để đặt'),
  body('selected_items.*')
    .isMongoId().withMessage('Cart item ID không hợp lệ'),

  // Danh sách khách đi tour
  body('booking_customers')
    .isArray({ min: 1 }).withMessage('Phải có ít nhất 1 khách đi tour'),
  body('booking_customers.*.cart_item_id')
    .notEmpty().withMessage('cart_item_id của khách là bắt buộc')
    .isString().withMessage('cart_item_id phải là chuỗi'),
  body('booking_customers.*.full_name')
    .notEmpty().withMessage('Họ tên khách đi tour là bắt buộc')
    .isString().withMessage('Họ tên phải là chuỗi')
    .isLength({ max: 255 }).withMessage('Họ tên không quá 255 ký tự'),
  body('booking_customers.*.phone')
    .notEmpty().withMessage('Số điện thoại khách đi tour là bắt buộc')
    .isString().withMessage('Số điện thoại phải là chuỗi'),
  body('booking_customers.*.email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Email khách không hợp lệ'),
  body('booking_customers.*.date_of_birth')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Ngày sinh phải đúng định dạng ISO 8601'),
  body('booking_customers.*.gender')
    .optional({ values: 'falsy' })
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Giới tính phải là MALE, FEMALE hoặc OTHER'),
  body('booking_customers.*.id_number')
    .optional({ values: 'falsy' })
    .isString().withMessage('Số CCCD/CMND phải là chuỗi')
    .isLength({ max: 50 }).withMessage('Số CCCD/CMND không quá 50 ký tự'),
  body('booking_customers.*.note')
    .optional()
    .isString().withMessage('Ghi chú phải là chuỗi')
    .isLength({ max: 500 }).withMessage('Ghi chú không quá 500 ký tự'),

  // Phương thức thanh toán
  body('payment_method')
    .optional()
    .isString().withMessage('Phương thức thanh toán phải là chuỗi'),

  // Mức thanh toán: toàn bộ 100% hoặc đặt cọc 50%
  body('payment_type')
    .optional()
    .isIn(['FULL', 'DEPOSIT'])
    .withMessage('Mức thanh toán phải là FULL hoặc DEPOSIT'),

  // Mã giảm giá
  body('coupon_code')
    .optional({ values: 'falsy' })
    .isString().withMessage('Mã giảm giá phải là chuỗi')
    .isLength({ max: 50 }).withMessage('Mã giảm giá không quá 50 ký tự'),
];

/**
 * Validation: Xem chi tiết đơn hàng theo ID
 */
const getOrderByIdValidation = [
  param('id')
    .notEmpty().withMessage('Order ID là bắt buộc')
    .isMongoId().withMessage('Order ID không hợp lệ'),
];

/**
 * Validation: Admin cập nhật trạng thái đơn hàng
 */
const updateOrderStatusValidation = [
  param('id')
    .notEmpty().withMessage('Order ID là bắt buộc')
    .isMongoId().withMessage('Order ID không hợp lệ'),
  body('order_status')
    .optional()
    .isIn(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Trạng thái đơn phải là CONFIRMED, CANCELLED hoặc COMPLETED'),
  body('payment_status')
    .optional()
    .isIn(['PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Trạng thái thanh toán phải là PAID, FAILED hoặc REFUNDED'),
  body('cancel_reason')
    .optional()
    .isString().withMessage('Lý do hủy phải là chuỗi')
    .isLength({ max: 500 }).withMessage('Lý do hủy không quá 500 ký tự'),
  // Phải có ít nhất 1 trong 2 trạng thái để cập nhật
  body().custom((value, { req }) => {
    const { order_status, payment_status } = req.body;
    if (!order_status && !payment_status) {
      throw new Error('Cần cung cấp ít nhất order_status hoặc payment_status để cập nhật');
    }
    return true;
  }),
];

/**
 * Validation: Khách hủy đơn của mình
 */
const cancelOrderValidation = [
  param('id')
    .notEmpty().withMessage('Order ID là bắt buộc')
    .isMongoId().withMessage('Order ID không hợp lệ'),
  body('cancel_reason')
    .optional()
    .isString().withMessage('Lý do hủy phải là chuỗi')
    .isLength({ max: 500 }).withMessage('Lý do hủy không quá 500 ký tự'),
];

/**
 * Validation: Query params lọc danh sách đơn (phân trang)
 */
const listOrdersQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Trang phải là số nguyên >= 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit phải là số nguyên từ 1 đến 50'),
  query('order_status')
    .optional()
    .isIn(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Trạng thái đơn không hợp lệ'),
  query('payment_status')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Trạng thái thanh toán không hợp lệ'),
];

module.exports = {
  checkoutValidation,
  getOrderByIdValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
  listOrdersQueryValidation,
};
