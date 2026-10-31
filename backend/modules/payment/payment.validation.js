const { body, param } = require('express-validator');

const createPaymentValidation = [
  body('orderId')
    .notEmpty().withMessage('Mã đơn hàng (orderId) là bắt buộc')
    .isMongoId().withMessage('orderId không đúng định dạng ObjectId'),
  body('paymentType')
    .optional()
    .isIn(['deposit', 'remaining', 'full'])
    .withMessage('paymentType phải là một trong: deposit, remaining, full'),
];

const getPaymentStatusValidation = [
  param('paymentId')
    .notEmpty().withMessage('paymentId là bắt buộc')
    .isMongoId().withMessage('paymentId không đúng định dạng ObjectId'),
];

const processRefundValidation = [
  param('cancellationId')
    .notEmpty().withMessage('cancellationId là bắt buộc')
    .isMongoId().withMessage('cancellationId không đúng định dạng ObjectId'),
  body('notes')
    .optional()
    .isString().withMessage('notes phải là chuỗi')
    .isLength({ max: 500 }).withMessage('notes không quá 500 ký tự'),
];

module.exports = {
  createPaymentValidation,
  getPaymentStatusValidation,
  processRefundValidation,
};

