const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo Tour mới (Create Tour)
 * Admin chỉ nhập original_price và discount_percent; sale_price do backend tính
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
    .notEmpty().withMessage('Phân loại Tour là bắt buộc')
    .isIn(['DOMESTIC', 'INTERNATIONAL']).withMessage('Phân loại phải là DOMESTIC hoặc INTERNATIONAL'),

  body('region')
    .optional({ values: 'null' })
    .isIn(['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'])
    .withMessage('Khu vực không hợp lệ'),

  body('destination_location')
    .trim()
    .notEmpty().withMessage('Điểm đến là bắt buộc'),

  body('duration')
    .trim()
    .notEmpty().withMessage('Thời gian Tour là bắt buộc'),

  body('original_price')
    .notEmpty().withMessage('Giá gốc là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Giá gốc phải là số >= 0'),

  body('discount_percent')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Phần trăm giảm phải từ 0 đến 100'),

  body('main_image')
    .trim()
    .notEmpty().withMessage('Ảnh đại diện Tour là bắt buộc'),

  body('gallery')
    .optional()
    .isArray().withMessage('Thư viện ảnh phải là mảng'),

  body('content_html')
    .optional()
    .isString().withMessage('Nội dung chi tiết phải là chuỗi'),

  body('itinerary')
    .optional()
    .isArray().withMessage('Lịch trình phải là mảng'),

  body('itinerary.*.day_title')
    .optional()
    .trim()
    .notEmpty().withMessage('Tiêu đề ngày trong lịch trình là bắt buộc'),

  body('itinerary.*.description')
    .optional()
    .trim()
    .notEmpty().withMessage('Mô tả hoạt động trong lịch trình là bắt buộc'),

  body('itinerary.*.order')
    .optional()
    .isInt({ min: 0 }).withMessage('Thứ tự phải là số nguyên >= 0'),

  body('itinerary.*.images')
    .optional()
    .isArray().withMessage('Danh sách ảnh lịch trình phải là mảng'),

  body('services_included')
    .optional()
    .isArray().withMessage('Dịch vụ bao gồm phải là mảng chuỗi'),

  body('services_excluded')
    .optional()
    .isArray().withMessage('Dịch vụ không bao gồm phải là mảng chuỗi'),

  body('special_conditions')
    .optional()
    .isString().withMessage('Điều kiện đặc biệt phải là chuỗi'),

  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
    .withMessage('Trạng thái Tour phải là DRAFT, ACTIVE hoặc INACTIVE'),
];

/**
 * Validation rules cho việc cập nhật Tour (Update Tour)
 * Tất cả trường optional, chỉ validate giá trị nếu được gửi lên
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
    .isIn(['DOMESTIC', 'INTERNATIONAL']).withMessage('Phân loại phải là DOMESTIC hoặc INTERNATIONAL'),

  body('region')
    .optional({ values: 'null' })
    .isIn(['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'])
    .withMessage('Khu vực không hợp lệ'),

  body('destination_location')
    .optional()
    .trim()
    .notEmpty().withMessage('Điểm đến không được để trống'),

  body('duration')
    .optional()
    .trim()
    .notEmpty().withMessage('Thời gian Tour không được để trống'),

  body('original_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá gốc phải là số >= 0'),

  body('discount_percent')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Phần trăm giảm phải từ 0 đến 100'),

  body('main_image')
    .optional()
    .trim()
    .notEmpty().withMessage('Ảnh đại diện không được để trống'),

  body('gallery')
    .optional()
    .isArray().withMessage('Thư viện ảnh phải là mảng'),

  body('content_html')
    .optional()
    .isString().withMessage('Nội dung chi tiết phải là chuỗi'),

  body('itinerary')
    .optional()
    .isArray().withMessage('Lịch trình phải là mảng'),

  body('services_included')
    .optional()
    .isArray().withMessage('Dịch vụ bao gồm phải là mảng chuỗi'),

  body('services_excluded')
    .optional()
    .isArray().withMessage('Dịch vụ không bao gồm phải là mảng chuỗi'),

  body('special_conditions')
    .optional()
    .isString().withMessage('Điều kiện đặc biệt phải là chuỗi'),

  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
    .withMessage('Trạng thái Tour phải là DRAFT, ACTIVE hoặc INACTIVE'),
];

/**
 * Validation rules cho việc đổi trạng thái Tour
 */
const changeStatusValidation = [
  param('id')
    .isMongoId().withMessage('ID Tour không hợp lệ'),

  body('status')
    .trim()
    .notEmpty().withMessage('Trạng thái mới là bắt buộc')
    .isIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
    .withMessage('Trạng thái Tour phải là DRAFT, ACTIVE hoặc INACTIVE'),
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
    .isIn(['DOMESTIC', 'INTERNATIONAL']).withMessage('Phân loại không hợp lệ'),

  query('region')
    .optional()
    .isIn(['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'CHAU_A', 'CHAU_AU', 'CHAU_MY', 'CHAU_UC'])
    .withMessage('Khu vực không hợp lệ'),

  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'newest'])
    .withMessage('Sắp xếp không hợp lệ'),
];

module.exports = {
  createTourValidation,
  updateTourValidation,
  changeStatusValidation,
  tourIdValidation,
  listToursValidation,
};
