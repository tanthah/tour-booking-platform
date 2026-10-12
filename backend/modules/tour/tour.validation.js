const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo Tour mới (Create Tour Validation Schema)
 */
const createTourValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã Tour là bắt buộc')
    .isLength({ max: 20 }).withMessage('Mã Tour không quá 20 ký tự'),

  body('title')
    .trim()
    .notEmpty().withMessage('Tên Tour là bắt buộc')
    .isLength({ min: 5, max: 255 }).withMessage('Tên Tour phải từ 5 đến 255 ký tự'),

  body('category')
    .notEmpty().withMessage('Danh mục Tour là bắt buộc')
    .isMongoId().withMessage('Danh mục Tour không hợp lệ'),

  body('region')
    .optional()
    .isIn(['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'])
    .withMessage('Khu vực không hợp lệ'),

  body('departure_location')
    .trim()
    .notEmpty().withMessage('Điểm khởi hành là bắt buộc'),

  body('destination_location')
    .trim()
    .notEmpty().withMessage('Điểm đến là bắt buộc'),

  body('duration')
    .trim()
    .notEmpty().withMessage('Thời gian Tour là bắt buộc'),

  body('departure_date')
    .notEmpty().withMessage('Ngày khởi hành là bắt buộc')
    .isISO8601().withMessage('Ngày khởi hành phải đúng định dạng ISO 8601'),

  body('end_date')
    .optional()
    .isISO8601().withMessage('Ngày kết thúc phải đúng định dạng ISO 8601'),

  body('price')
    .notEmpty().withMessage('Giá Tour là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Giá Tour phải là số >= 0'),

  body('original_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá gốc phải là số >= 0'),

  body('price_adult').optional().isFloat({ min: 0 }).withMessage('Giá người lớn phải >= 0'),
  body('price_child').optional().isFloat({ min: 0 }).withMessage('Giá trẻ em phải >= 0'),
  body('price_baby').optional().isFloat({ min: 0 }).withMessage('Giá em bé phải >= 0'),
  body('original_price_adult').optional().isFloat({ min: 0 }).withMessage('Giá gốc người lớn phải >= 0'),
  body('original_price_child').optional().isFloat({ min: 0 }).withMessage('Giá gốc trẻ em phải >= 0'),
  body('original_price_baby').optional().isFloat({ min: 0 }).withMessage('Giá gốc em bé phải >= 0'),

  body('total_slots')
    .notEmpty().withMessage('Tổng số chỗ là bắt buộc')
    .isInt({ min: 1 }).withMessage('Tổng số chỗ phải là số nguyên >= 1'),

  body('remaining_slots')
    .notEmpty().withMessage('Số chỗ còn lại là bắt buộc')
    .isInt({ min: 0 }).withMessage('Số chỗ còn lại phải là số nguyên >= 0'),

  body('max_adults').optional().isInt({ min: 0 }).withMessage('Số người lớn tối đa phải >= 0'),
  body('max_children').optional().isInt({ min: 0 }).withMessage('Số trẻ em tối đa phải >= 0'),
  body('max_babies').optional().isInt({ min: 0 }).withMessage('Số em bé tối đa phải >= 0'),

  body('main_image')
    .trim()
    .notEmpty().withMessage('Ảnh đại diện Tour là bắt buộc'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'DRAFT', 'PUBLISHED', 'FULL', 'CLOSED', 'CANCELLED'])
    .withMessage('Trạng thái không hợp lệ'),
];

/**
 * Validation rules cho việc cập nhật Tour (Update Tour Validation Schema)
 * Tất cả các trường đều optional, chỉ validate giá trị nếu được gửi lên
 */
const updateTourValidation = [
  param('id')
    .isMongoId().withMessage('ID Tour không hợp lệ'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('Tên Tour phải từ 5 đến 255 ký tự'),

  body('category')
    .optional()
    .isMongoId().withMessage('Danh mục Tour không hợp lệ'),

  body('region')
    .optional()
    .isIn(['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'])
    .withMessage('Khu vực không hợp lệ'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá Tour phải là số >= 0'),

  body('original_price').optional().isFloat({ min: 0 }).withMessage('Giá gốc phải >= 0'),
  body('price_adult').optional().isFloat({ min: 0 }).withMessage('Giá người lớn phải >= 0'),
  body('price_child').optional().isFloat({ min: 0 }).withMessage('Giá trẻ em phải >= 0'),
  body('price_baby').optional().isFloat({ min: 0 }).withMessage('Giá em bé phải >= 0'),
  body('original_price_adult').optional().isFloat({ min: 0 }).withMessage('Giá gốc người lớn phải >= 0'),
  body('original_price_child').optional().isFloat({ min: 0 }).withMessage('Giá gốc trẻ em phải >= 0'),
  body('original_price_baby').optional().isFloat({ min: 0 }).withMessage('Giá gốc em bé phải >= 0'),

  body('total_slots')
    .optional()
    .isInt({ min: 1 }).withMessage('Tổng số chỗ phải là số nguyên >= 1'),

  body('remaining_slots')
    .optional()
    .isInt({ min: 0 }).withMessage('Số chỗ còn lại phải là số nguyên >= 0'),

  body('max_adults').optional().isInt({ min: 0 }).withMessage('Số người lớn tối đa phải >= 0'),
  body('max_children').optional().isInt({ min: 0 }).withMessage('Số trẻ em tối đa phải >= 0'),
  body('max_babies').optional().isInt({ min: 0 }).withMessage('Số em bé tối đa phải >= 0'),

  body('departure_date')
    .optional()
    .isISO8601().withMessage('Ngày khởi hành phải đúng định dạng ISO 8601'),

  body('end_date')
    .optional()
    .isISO8601().withMessage('Ngày kết thúc phải đúng định dạng ISO 8601'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'DRAFT', 'PUBLISHED', 'FULL', 'CLOSED', 'CANCELLED'])
    .withMessage('Trạng thái không hợp lệ'),
];

/**
 * Validation rules cho việc đổi trạng thái Tour (Change Status Validation Schema)
 */
const changeStatusValidation = [
  param('id')
    .isMongoId().withMessage('ID Tour không hợp lệ'),

  body('status')
    .trim()
    .notEmpty().withMessage('Trạng thái mới là bắt buộc')
    .isIn(['ACTIVE', 'INACTIVE', 'DRAFT', 'PUBLISHED', 'FULL', 'CLOSED', 'CANCELLED'])
    .withMessage('Trạng thái không hợp lệ'),
];

/**
 * Validation rules cho param ID Tour
 */
const tourIdValidation = [
  param('id')
    .isMongoId().withMessage('ID Tour không hợp lệ'),
];

/**
 * Validation rules cho query params tìm kiếm / lọc danh sách Tour
 */
const listToursValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Trang phải là số nguyên >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng mỗi trang từ 1 đến 50'),

  query('category')
    .optional()
    .isString().withMessage('Danh mục không hợp lệ'),

  query('region')
    .optional()
    .isIn(['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'])
    .withMessage('Khu vực không hợp lệ'),

  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'date_asc', 'date_desc', 'newest'])
    .withMessage('Sắp xếp không hợp lệ'),
];

module.exports = {
  createTourValidation,
  updateTourValidation,
  changeStatusValidation,
  tourIdValidation,
  listToursValidation,
};
