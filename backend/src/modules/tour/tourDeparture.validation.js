const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo đợt khởi hành mới (Create TourDeparture)
 * Yêu cầu: start_datetime (hoặc departure_date), meeting_point (hoặc meeting_point_address), total_slots >= 1
 */
const createDepartureValidation = [
  param('productId')
    .isMongoId().withMessage('Tour ID không hợp lệ'),

  body('start_datetime')
    .optional()
    .isISO8601().withMessage('Ngày giờ bắt đầu tour phải đúng định dạng ISO 8601'),

  body('departure_date')
    .optional()
    .isISO8601().withMessage('Ngày khởi hành phải đúng định dạng ISO 8601'),

  body().custom((value, { req }) => {
    if (!req.body.start_datetime && !req.body.departure_date) {
      throw new Error('Ngày và giờ tour bắt đầu là bắt buộc');
    }
    const mp = (req.body.meeting_point || req.body.meeting_point_address || '').trim();
    if (!mp) {
      throw new Error('Địa điểm tập trung là bắt buộc');
    }
    return true;
  }),

  body('total_slots')
    .notEmpty().withMessage('Tổng số chỗ là bắt buộc')
    .isInt({ min: 1 }).withMessage('Tổng số chỗ phải là số nguyên >= 1'),
];

/**
 * Validation rules cho việc cập nhật đợt khởi hành (Update TourDeparture)
 */
const updateDepartureValidation = [
  param('id')
    .isMongoId().withMessage('ID đợt khởi hành không hợp lệ'),

  body('start_datetime')
    .optional()
    .isISO8601().withMessage('Ngày giờ bắt đầu tour phải đúng định dạng ISO 8601'),

  body('departure_date')
    .optional()
    .isISO8601().withMessage('Ngày khởi hành phải đúng định dạng ISO 8601'),

  body('meeting_point')
    .optional()
    .trim(),

  body('meeting_point_address')
    .optional()
    .trim(),

  body('meeting_point_change_reason')
    .optional()
    .trim(),

  body('reason')
    .optional()
    .trim(),

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
