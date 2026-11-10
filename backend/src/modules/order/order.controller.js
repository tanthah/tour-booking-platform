const { validationResult } = require('express-validator');
const orderService = require('./order.service');
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

const checkout = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  await orderService.expirePendingOrders();
  const order = await orderService.createOrderFromCart(req.user._id, req.body);
  ApiResponse.success(res, 201, 'Đặt tour thành công', order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  await orderService.expirePendingOrders();
  const result = await orderService.getMyOrders(req.user._id, req.query);
  ApiResponse.success(res, 200, 'Lấy lịch sử đơn hàng thành công', result);
});

const getOrderDetail = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const userRoles = req.user.roles || [];
  const order = await orderService.getOrderDetail(req.user._id, req.params.id, userRoles);
  ApiResponse.success(res, 200, 'Lấy chi tiết đơn hàng thành công', order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await orderService.cancelOrder(req.user._id, req.params.id, req.body.cancel_reason);
  ApiResponse.success(res, 200, 'Hủy đơn hàng thành công', result);
});

const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  await orderService.expirePendingOrders();
  const result = await orderService.getAllOrdersAdmin(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách đơn hàng thành công', result);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const order = await orderService.updateOrderStatus(req.params.id, req.body, req.user._id);
  ApiResponse.success(res, 200, 'Cập nhật trạng thái đơn hàng thành công', order);
});

const confirmDeposit = asyncHandler(async (req, res) => {
  const order = await orderService.confirmDeposit(req.params.id, req.user._id);
  ApiResponse.success(res, 200, 'Xác nhận đặt cọc 30% thành công', order);
});

const companyCancel = asyncHandler(async (req, res) => {
  const result = await orderService.companyCancelOrder(req.params.id, req.user._id, req.body.cancel_reason);
  ApiResponse.success(res, 200, 'Công ty hủy tour thành công, đã tạo yêu cầu hoàn tiền 100%', result);
});

const resolveOverdue = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await orderService.resolveOverdueOrder(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, 200, 'Xử lý đơn quá hạn thành công', result);
});

const addOrderNote = asyncHandler(async (req, res) => {
  const note = await orderService.addOrderNote(req.params.id, req.user._id, req.body.content);
  ApiResponse.success(res, 201, 'Thêm ghi chú nội bộ thành công', note);
});

const getOrderLogs = asyncHandler(async (req, res) => {
  const logs = await orderService.getOrderLogs(req.params.id);
  ApiResponse.success(res, 200, 'Lấy nhật ký đơn hàng thành công', logs);
});

module.exports = {
  checkout,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatus,
  confirmDeposit,
  companyCancel,
  resolveOverdue,
  addOrderNote,
  getOrderLogs,
};
