const { validationResult } = require('express-validator');
const paymentService = require('./payment.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
    return false;
  }
  return true;
};

/**
 * POST /api/payments/zalopay/create
 * Khách hàng tạo giao dịch thanh toán ZaloPay (cọc 30% hoặc thanh toán số dư)
 */
const createPayment = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await paymentService.createPayment(req.user._id, req.body);
  ApiResponse.success(res, 201, 'Tạo giao dịch ZaloPay thành công', result);
});

/**
 * POST /api/payments/zalopay/callback
 * ZaloPay Server gọi webhook IPN (công khai, không kèm Bearer token)
 * Phải trả JSON chính xác chuẩn { return_code, return_message } cho ZaloPay
 */
const handleZaloPayCallback = async (req, res) => {
  try {
    const result = await paymentService.handleZaloPayCallback(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({ return_code: 0, return_message: error.message });
  }
};

/**
 * GET /api/payments/:paymentId/status
 * Kiểm tra trạng thái giao dịch & thời gian còn lại của mã QR
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userRole = req.user?.role?.name || req.user?.role || 'CUSTOMER';
  const result = await paymentService.getPaymentStatus(
    req.params.paymentId,
    req.user._id,
    [userRole]
  );
  ApiResponse.success(res, 200, 'Lấy trạng thái thanh toán thành công', result);
});

/**
 * GET /api/payments/order/:orderId
 * Lấy lịch sử tất cả các giao dịch thanh toán của một đơn hàng
 */
const getPaymentsByOrder = asyncHandler(async (req, res) => {
  const userRole = req.user?.role?.name || req.user?.role || 'CUSTOMER';
  const result = await paymentService.getPaymentsByOrder(
    req.params.orderId,
    req.user._id,
    [userRole]
  );
  ApiResponse.success(res, 200, 'Lấy lịch sử thanh toán đơn hàng thành công', result);
});

/**
 * POST /api/admin/refunds/:cancellationId
 * Admin phê duyệt và gọi ZaloPay API hoàn tiền
 */
const processRefund = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await paymentService.processZaloPayRefund({
    cancellationId: req.params.cancellationId,
    adminId: req.user._id,
    notes: req.body.notes,
  });
  ApiResponse.success(res, 200, 'Xử lý hoàn tiền ZaloPay thành công', result);
});

module.exports = {
  createPayment,
  handleZaloPayCallback,
  getPaymentStatus,
  getPaymentsByOrder,
  processRefund,
};
