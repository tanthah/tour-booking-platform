const refundService = require('./refund.service');
const Order = require('./order.model');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Controller: Xem danh sách hoàn tiền của đơn hàng
 * GET /api/orders/:id/refunds
 * Quyền: CUSTOMER (chủ đơn) hoặc ADMIN/STAFF
 */
const getOrderRefunds = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id).select('user_id');
  if (!order) {
    return ApiResponse.error(res, 404, 'Đơn hàng không tồn tại.');
  }

  const isOwner = order.user_id.toString() === req.user._id.toString();
  const isStaffOrAdmin = (req.user.roles || []).some((r) => ['ADMIN', 'STAFF'].includes(r));
  if (!isOwner && !isStaffOrAdmin) {
    return ApiResponse.error(res, 403, 'Bạn không có quyền xem thông tin hoàn tiền của đơn này.');
  }

  const refunds = await refundService.getRefundsByOrder(id);
  ApiResponse.success(res, 200, 'Lấy lịch sử hoàn tiền thành công', refunds);
});

/**
 * Controller: Admin lấy tất cả yêu cầu hoàn tiền
 * GET /api/orders/admin/refunds
 * Quyền: ADMIN, STAFF
 */
const getAllRefundsAdmin = asyncHandler(async (req, res) => {
  const result = await refundService.getAllRefundsAdmin(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách yêu cầu hoàn tiền thành công', result);
});

/**
 * Controller: Admin bắt đầu duyệt và xử lý hoàn tiền
 * PATCH /api/orders/admin/refunds/:refundId/process
 * Quyền: ADMIN, STAFF
 */
const processRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const refund = await refundService.processRefund(refundId, req.user._id);
  ApiResponse.success(res, 200, 'Bắt đầu xử lý hoàn tiền thành công', refund);
});

/**
 * Controller: Admin xác nhận hoàn tiền thành công
 * PATCH /api/orders/admin/refunds/:refundId/complete
 * Quyền: ADMIN, STAFF
 */
const completeRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const { transaction_id } = req.body;
  const refund = await refundService.completeRefund(refundId, req.user._id, transaction_id);
  ApiResponse.success(res, 200, 'Xác nhận hoàn tiền thành công', refund);
});

/**
 * Controller: Admin ghi nhận hoàn tiền thất bại
 * PATCH /api/orders/admin/refunds/:refundId/fail
 * Quyền: ADMIN, STAFF
 */
const failRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const { note } = req.body;
  const refund = await refundService.failRefund(refundId, req.user._id, note);
  ApiResponse.success(res, 200, 'Đã ghi nhận hoàn tiền thất bại', refund);
});

module.exports = {
  getOrderRefunds,
  getAllRefundsAdmin,
  processRefund,
  completeRefund,
  failRefund,
};

