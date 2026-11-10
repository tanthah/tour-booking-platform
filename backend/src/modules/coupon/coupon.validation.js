const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo Coupon mới (Admin)
 */
const createCouponValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã coupon là bắt buộc')
    .isLength({ min: 3, max: 50 }).withMessage('Mã coupon từ 3 đến 50 ký tự')
    .matches(/^[A-Z0-9_-]+$/i).withMessage('Mã coupon chỉ gồm chữ cái, số, dấu gạch ngang và gạch dưới'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),

  body('discount_percent')
    .notEmpty().withMessage('Phần trăm giảm giá là bắt buộc')
    .isFloat({ min: 1, max: 100 }).withMessage('Phần trăm giảm từ 1 đến 100'),

  body('max_discount_amount')
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage('Mức giảm tối đa phải >= 0'),

  body('min_order_amount')
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage('Đơn tối thiểu phải >= 0'),

  body('usage_limit')
    .optional({ values: 'null' })
    .isInt({ min: 1 }).withMessage('Tổng lượt dùng phải >= 1'),

  body('per_user_limit')
    .optional()
    .isInt({ min: 1 }).withMessage('Giới hạn mỗi khách phải >= 1'),

  body('start_at')
    .notEmpty().withMessage('Ngày bắt đầu là bắt buộc')
    .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),

  body('end_at')
    .notEmpty().withMessage('Ngày kết thúc là bắt buộc')
    .isISO8601().withMessage('Ngày kết thúc không hợp lệ')
    .custom((endAt, { req }) => {
      if (new Date(endAt) <= new Date(req.body.start_at)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trạng thái phải là ACTIVE hoặc INACTIVE'),

  body('user_target')
    .optional()
    .isIn(['ALL', 'NEW_USER']).withMessage('Đối tượng khách hàng phải là ALL hoặc NEW_USER'),

  body('applies_to')
    .optional()
    .isIn(['ALL', 'CATEGORY', 'SEASON', 'SPECIFIC_TOURS']).withMessage('Phạm vi áp dụng không hợp lệ'),

  body('applicable_categories')
    .optional()
    .isArray().withMessage('Danh mục tour phải là mảng'),

  body('applicable_seasons')
    .optional()
    .isArray().withMessage('Mùa du lịch phải là mảng'),

  body('applicable_tour_ids')
    .optional()
    .isArray().withMessage('Danh sách ID tour phải là mảng'),
];

/**
 * Validation rules cho việc cập nhật Coupon (Admin)
 */
const updateCouponValidation = [
  param('id')
    .isMongoId().withMessage('ID Coupon không hợp lệ'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),

  body('discount_percent')
    .optional()
    .isFloat({ min: 1, max: 100 }).withMessage('Phần trăm giảm từ 1 đến 100'),

  body('max_discount_amount')
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage('Mức giảm tối đa phải >= 0'),

  body('min_order_amount')
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage('Đơn tối thiểu phải >= 0'),

  body('usage_limit')
    .optional({ values: 'null' })
    .isInt({ min: 1 }).withMessage('Tổng lượt dùng phải >= 1'),

  body('per_user_limit')
    .optional()
    .isInt({ min: 1 }).withMessage('Giới hạn mỗi khách phải >= 1'),

  body('start_at')
    .optional()
    .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),

  body('end_at')
    .optional()
    .isISO8601().withMessage('Ngày kết thúc không hợp lệ'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trạng thái phải là ACTIVE hoặc INACTIVE'),

  body('user_target')
    .optional()
    .isIn(['ALL', 'NEW_USER']).withMessage('Đối tượng khách hàng phải là ALL hoặc NEW_USER'),

  body('applies_to')
    .optional()
    .isIn(['ALL', 'CATEGORY', 'SEASON', 'SPECIFIC_TOURS']).withMessage('Phạm vi áp dụng không hợp lệ'),

  body('applicable_categories')
    .optional()
    .isArray().withMessage('Danh mục tour phải là mảng'),

  body('applicable_seasons')
    .optional()
    .isArray().withMessage('Mùa du lịch phải là mảng'),

  body('applicable_tour_ids')
    .optional()
    .isArray().withMessage('Danh sách ID tour phải là mảng'),
];

/**
 * Validation cho param ID Coupon
 */
const couponIdValidation = [
  param('id')
    .isMongoId().withMessage('ID Coupon không hợp lệ'),
];

/**
 * Validation cho đổi trạng thái Coupon
 */
const changeCouponStatusValidation = [
  param('id')
    .isMongoId().withMessage('ID Coupon không hợp lệ'),

  body('status')
    .trim()
    .notEmpty().withMessage('Trạng thái mới là bắt buộc')
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trạng thái phải là ACTIVE hoặc INACTIVE'),
];

/**
 * Validation cho query params lấy danh sách Coupon (Admin)
 */
const listCouponsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Trang phải >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng mỗi trang từ 1 đến 50'),

  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trạng thái không hợp lệ'),
];

/**
 * Validation cho khách hàng gửi mã coupon (validate / apply)
 */
const validateCouponInput = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã coupon là bắt buộc')
    .isLength({ min: 3, max: 50 }).withMessage('Mã coupon từ 3 đến 50 ký tự'),

  body('subtotal')
    .notEmpty().withMessage('Tổng tiền đơn hàng là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Tổng tiền phải >= 0'),
];

module.exports = {
  createCouponValidation,
  updateCouponValidation,
  couponIdValidation,
  changeCouponStatusValidation,
  listCouponsValidation,
  validateCouponInput,
};
