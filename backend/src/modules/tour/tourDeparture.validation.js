const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo đợt khởi hành mới (Create TourDeparture)
 * Admin chỉ nhập total_slots; booked_slots, reserved_slots do hệ thống quản lý
 */
const createDepartureValidation = [
  param('productId')
    .isMongoId().withMessage('Tour ID không hợp lệ'),

  body('departure_date')
    .notEmpty().withMessage('Ngày khởi hành là bắt buộc')
    .isISO8601().withMessage('Ngày khởi hành phải đúng định dạng ISO 8601'),

  body('departure_location')
    .trim()
    .notEmpty().withMessage('Điểm khởi hành là bắt buộc'),

  body('vehicle')
    .optional()
    .trim()
    .notEmpty().withMessage('Phương tiện không được để trống'),

  body('total_slots')
    .notEmpty().withMessage('Tổng số chỗ là bắt buộc')
    .isInt({ min: 1 }).withMessage('Tổng số chỗ phải là số nguyên >= 1'),
];

/**
 * Validation rules cho việc cập nhật đợt khởi hành (Update TourDeparture)
 * Không cho sửa departure_date nếu đợt đã có Booking (kiểm tra ở service)
 */
const updateDepartureValidation = [
  param('id')
    .isMongoId().withMessage('ID đợt khởi hành không hợp lệ'),

  body('departure_date')
    .optional()
    .isISO8601().withMessage('Ngày khởi hành phải đúng định dạng ISO 8601'),

  body('departure_location')
    .optional()
    .trim()
    .notEmpty().withMessage('Điểm khởi hành không được để trống'),

  body('vehicle')
    .optional()
    .trim()
    .notEmpty().withMessage('Phương tiện không được để trống'),

  body('total_slots')
    .optional()
    .isInt({ min: 1 }).withMessage('Tổng số chỗ phải là số nguyên >= 1'),
];

/**
 * Validation rules cho việc đổi trạng thái đợt khởi hành
 */
const changeDepartureStatusValidation = [
  param('id')
    .isMongoId().withMessage('ID đợt khởi hành không hợp lệ'),

  body('status')
    .trim()
    .notEmpty().withMessage('Trạng thái mới là bắt buộc')
    .isIn(['OPEN', 'FULL', 'CLOSED', 'CANCELLED'])
    .withMessage('Trạng thái đợt phải là OPEN, FULL, CLOSED hoặc CANCELLED'),
];

/**
 * Validation rules cho param ID đợt khởi hành
 */
const departureIdValidation = [
  param('id')
    .isMongoId().withMessage('ID đợt khởi hành không hợp lệ'),
];

/**
 * Validation rules cho param productId (Tour)
 */
const productIdValidation = [
  param('productId')
    .isMongoId().withMessage('Tour ID không hợp lệ'),
];

/**
 * Validation rules cho query params lọc danh sách đợt khởi hành
 */
const listDeparturesValidation = [
  param('productId')
    .isMongoId().withMessage('Tour ID không hợp lệ'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Trang phải là số nguyên >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng mỗi trang từ 1 đến 50'),

  query('status')
    .optional()
    .isIn(['OPEN', 'FULL', 'CLOSED', 'CANCELLED'])
    .withMessage('Trạng thái lọc không hợp lệ'),
];

module.exports = {
  createDepartureValidation,
  updateDepartureValidation,
  changeDepartureStatusValidation,
  departureIdValidation,
  productIdValidation,
  listDeparturesValidation,
};
