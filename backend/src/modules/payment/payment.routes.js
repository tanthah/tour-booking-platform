const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  createPaymentValidation,
  getPaymentStatusValidation,
  processRefundValidation,
} = require('./payment.validation');

const customerAuth = [authenticate, authorize('CUSTOMER', 'ADMIN', 'STAFF')];
const adminAuth = [authenticate, authorize('ADMIN')];

// 1. Tạo giao dịch thanh toán ZaloPay (Customer)
router.post(
  '/zalopay/create',
  ...customerAuth,
  createPaymentValidation,
  paymentController.createPayment
);

// 2. IPN Callback nhận từ ZaloPay Server (Công khai, không dùng JWT auth)
router.post(
  '/zalopay/callback',
  paymentController.handleZaloPayCallback
);

// 3. Kiểm tra trạng thái giao dịch & countdown QR (Customer / Admin)
router.get(
  '/:paymentId/status',
  ...customerAuth,
  getPaymentStatusValidation,
  paymentController.getPaymentStatus
);

// 4. Lịch sử các lần thanh toán theo đơn hàng (Customer / Admin)
router.get(
  '/order/:orderId',
  ...customerAuth,
  paymentController.getPaymentsByOrder
);

// 5. Admin thực hiện hoàn tiền ZaloPay khi đơn hủy
router.post(
  '/admin/refunds/:cancellationId',
  ...adminAuth,
  processRefundValidation,
  paymentController.processRefund
);

module.exports = router;
