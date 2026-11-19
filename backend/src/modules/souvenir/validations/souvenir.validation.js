const { body, param, query } = require('express-validator');

const createAlbumValidation = [
  body('departure_id')
    .notEmpty().withMessage('Mã đợt khởi hành (departure_id) là bắt buộc')
    .isMongoId().withMessage('departure_id không đúng định dạng ObjectId'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Tiêu đề album không được vượt quá 255 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Mô tả album không được vượt quá 1000 ký tự'),
];

const updateAlbumValidation = [
  param('albumId')
    .isMongoId().withMessage('albumId không hợp lệ'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Tiêu đề không được để trống')
    .isLength({ max: 255 }).withMessage('Tiêu đề không vượt quá 255 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Mô tả không vượt quá 1000 ký tự'),
];

const assignPhotoValidation = [
  param('photoId')
    .isMongoId().withMessage('photoId không hợp lệ'),
  body('assignments')
    .isArray({ min: 1 }).withMessage('Danh sách assignments phải là mảng có ít nhất 1 phần tử'),
  body('assignments.*.order_id')
    .isMongoId().withMessage('order_id trong assignments không hợp lệ'),
  body('assignments.*.order_item_id')
    .isMongoId().withMessage('order_item_id trong assignments không hợp lệ'),
  body('assignments.*.booking_customer_id')
    .isMongoId().withMessage('booking_customer_id trong assignments không hợp lệ'),
];

const removeAssignmentValidation = [
  param('photoId')
    .isMongoId().withMessage('photoId không hợp lệ'),
  body('booking_customer_id')
    .isMongoId().withMessage('booking_customer_id là bắt buộc và phải là ObjectId'),
];

const createCardValidation = [
  body('album_id')
    .notEmpty().withMessage('album_id là bắt buộc')
    .isMongoId().withMessage('album_id không hợp lệ'),
  body('order_id')
    .notEmpty().withMessage('order_id là bắt buộc')
    .isMongoId().withMessage('order_id không hợp lệ'),
  body('order_item_id')
    .notEmpty().withMessage('order_item_id là bắt buộc')
    .isMongoId().withMessage('order_item_id không hợp lệ'),
  body('booking_customer_id')
    .notEmpty().withMessage('booking_customer_id là bắt buộc')
    .isMongoId().withMessage('booking_customer_id không hợp lệ'),
];

const updateCardValidation = [
  param('cardId')
    .isMongoId().withMessage('cardId không hợp lệ'),
  body('personal_message')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Lời nhắn riêng không quá 2000 ký tự'),
  body('personal_photo_ids')
    .optional()
    .isArray().withMessage('personal_photo_ids phải là mảng ObjectId'),
];

const adminReviewValidation = [
  param('cardId')
    .isMongoId().withMessage('cardId không hợp lệ'),
  body('comment')
    .optional()
    .trim(),
];

const adminRevisionValidation = [
  param('cardId')
    .isMongoId().withMessage('cardId không hợp lệ'),
  body('reason')
    .notEmpty().withMessage('Lý do yêu cầu chỉnh sửa là bắt buộc')
    .trim(),
];

const adminRevokeValidation = [
  param('cardId')
    .isMongoId().withMessage('cardId không hợp lệ'),
  body('reason')
    .notEmpty().withMessage('Lý do thu hồi thiệp là bắt buộc')
    .trim(),
];

module.exports = {
  createAlbumValidation,
  updateAlbumValidation,
  assignPhotoValidation,
  removeAssignmentValidation,
  createCardValidation,
  updateCardValidation,
  adminReviewValidation,
  adminRevisionValidation,
  adminRevokeValidation,
};

