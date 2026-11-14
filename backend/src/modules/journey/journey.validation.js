const { body, param, query } = require('express-validator');

const journeyIdValidation = [
  param('journeyId').isMongoId().withMessage('journeyId không hợp lệ'),
];

const stopParamsValidation = [
  param('journeyId').isMongoId().withMessage('journeyId không hợp lệ'),
  param('stopId').isMongoId().withMessage('stopId không hợp lệ'),
];

const notificationParamsValidation = [
  param('journeyId').isMongoId().withMessage('journeyId không hợp lệ'),
  param('notifId').isMongoId().withMessage('notifId không hợp lệ'),
];

const startJourneyValidation = [
  ...journeyIdValidation,
  body('version').optional({ nullable: true }).isInt({ min: 0 }).withMessage('version không hợp lệ'),
  body('note').optional().isString().isLength({ max: 1000 }),
];

const completeJourneyValidation = [
  ...journeyIdValidation,
  body('version').optional({ nullable: true }).isInt({ min: 0 }).withMessage('version không hợp lệ'),
  body('reason').optional().isString().isLength({ max: 500 }),
  body('note').optional().isString().isLength({ max: 1000 }),
];

const updateStopStatusValidation = [
  ...stopParamsValidation,
  body('status')
    .notEmpty()
    .withMessage('Trạng thái mới là bắt buộc')
    .isIn(['PENDING', 'TRAVELLING', 'VISITING', 'COMPLETED'])
    .withMessage('Trạng thái không hợp lệ'),
  body('is_exception').optional().isBoolean(),
  body('reason').optional().isString().isLength({ max: 500 }),
  body('note').optional().isString().isLength({ max: 1000 }),
  body('version').optional({ nullable: true }).isInt({ min: 0 }),
];

const skipStopValidation = [
  ...stopParamsValidation,
  body('reason').trim().notEmpty().withMessage('Bắt buộc phải nhập lý do khi bỏ qua địa điểm').isLength({ max: 500 }),
  body('note').optional().isString().isLength({ max: 1000 }),
  body('version').optional({ nullable: true }).isInt({ min: 0 }),
];

const addStopValidation = [
  ...journeyIdValidation,
  body('name').trim().notEmpty().withMessage('Tên địa điểm là bắt buộc').isLength({ max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('address').optional().isString().isLength({ max: 500 }),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Vĩ độ phải nằm trong khoảng [-90, 90]'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Kinh độ phải nằm trong khoảng [-180, 180]'),
  body('day_number').optional().isInt({ min: 1 }),
  body('planned_start').optional({ nullable: true }).isISO8601().withMessage('planned_start phải là ISO date hợp lệ'),
  body('planned_end').optional({ nullable: true }).isISO8601().withMessage('planned_end phải là ISO date hợp lệ'),
  body('insert_after_stop_id').optional({ nullable: true }).isMongoId(),
  body('reason').trim().notEmpty().withMessage('Bắt buộc phải nhập lý do khi thêm địa điểm phát sinh').isLength({ max: 500 }),
  body('note').optional().isString().isLength({ max: 1000 }),
];

const reorderStopsValidation = [
  ...journeyIdValidation,
  body('ordered_stop_ids').isArray({ min: 1 }).withMessage('ordered_stop_ids phải là mảng không rỗng'),
  body('ordered_stop_ids.*').isMongoId().withMessage('Mỗi ID điểm dừng phải hợp lệ'),
  body('reason').trim().notEmpty().withMessage('Bắt buộc phải nhập lý do khi thay đổi thứ tự').isLength({ max: 500 }),
  body('note').optional().isString().isLength({ max: 1000 }),
  body('version').optional({ nullable: true }).isInt({ min: 0 }),
];

const adjustStopTimeValidation = [
  ...stopParamsValidation,
  body('planned_start').optional({ nullable: true }).isISO8601().withMessage('planned_start không hợp lệ'),
  body('planned_end').optional({ nullable: true }).isISO8601().withMessage('planned_end không hợp lệ'),
  body('reason').trim().notEmpty().withMessage('Bắt buộc phải nhập lý do khi điều chỉnh thời gian').isLength({ max: 500 }),
  body('note').optional().isString().isLength({ max: 1000 }),
  body('version').optional({ nullable: true }).isInt({ min: 0 }),
];

const updateStopNoteValidation = [
  ...stopParamsValidation,
  body('note').isString().isLength({ max: 1000 }),
  body('reason').optional().isString().isLength({ max: 500 }),
];

const createJourneyValidation = [
  body('departure_id').isMongoId().withMessage('departure_id không hợp lệ'),
  body('guide_id').optional({ nullable: true }).isMongoId().withMessage('guide_id không hợp lệ'),
  body('stops').optional().isArray(),
  body('stops.*.name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('stops.*.latitude').optional().isFloat({ min: -90, max: 90 }),
  body('stops.*.longitude').optional().isFloat({ min: -180, max: 180 }),
];

const assignGuideValidation = [
  ...journeyIdValidation,
  body('guide_id').optional({ nullable: true }).isMongoId().withMessage('guide_id không hợp lệ'),
  body('reason').optional().isString().isLength({ max: 500 }),
];

const cancelJourneyValidation = [
  ...journeyIdValidation,
  body('reason').trim().notEmpty().withMessage('Bắt buộc phải nhập lý do khi hủy hành trình').isLength({ max: 500 }),
];

const listJourneysQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
];

module.exports = {
  journeyIdValidation,
  stopParamsValidation,
  notificationParamsValidation,
  startJourneyValidation,
  completeJourneyValidation,
  updateStopStatusValidation,
  skipStopValidation,
  addStopValidation,
  reorderStopsValidation,
  adjustStopTimeValidation,
  updateStopNoteValidation,
  createJourneyValidation,
  assignGuideValidation,
  cancelJourneyValidation,
  listJourneysQueryValidation,
};

