const { validationResult } = require('express-validator');
const orderService = require('./order.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Hàm helper kiểm tra và xử lý lỗi Validation từ express-validator
 */
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
 * Controller: Checkout — Tạo đơn hàng từ giỏ hàng
 * POST /api/orders
 * Quyền: CUSTOMER
 */
const checkout = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  // Chạy hủy đơn hết hạn trước khi tạo đơn mới (giải phóng chỗ)
  await orderService.expirePendingOrders();

  const order = await orderService.createOrderFromCart(req.user._id, req.body);
  ApiResponse.success(res, 201, 'Đặt tour thành công', order);
});

/**
 * Controller: Lấy lịch sử đơn hàng của khách đang đăng nhập
 * GET /api/orders
 * Quyền: CUSTOMER
 */
const getMyOrders = asyncHandler(async (req, res) => {
  // Chạy hủy đơn hết hạn để cập nhật trạng thái chính xác
  await orderService.expirePendingOrders();

  const result = await orderService.getMyOrders(req.user._id, req.query);
  ApiResponse.success(res, 200, 'Lấy lịch sử đơn hàng thành công', result);
});

/**
 * Controller: Xem chi tiết đơn hàng
 * GET /api/orders/:id
 * Quyền: CUSTOMER (chủ đơn) hoặc ADMIN/STAFF
 */
const getOrderDetail = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const userRoles = req.user.roles || [];
  const order = await orderService.getOrderDetail(
    req.user._id,
    req.params.id,
    userRoles
  );
  ApiResponse.success(res, 200, 'Lấy chi tiết đơn hàng thành công', order);
});

/**
 * Controller: Khách tự hủy đơn đang chờ thanh toán
 * PATCH /api/orders/:id/cancel
 * Quyền: CUSTOMER (chủ đơn)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const order = await orderService.cancelOrder(
    req.user._id,
    req.params.id,
    req.body.cancel_reason
  );
  ApiResponse.success(res, 200, 'Hủy đơn hàng thành công', order);
});

/**
 * Controller: Admin lấy danh sách tất cả đơn hàng (phân trang, lọc)
 * GET /api/admin/orders
 * Quyền: ADMIN, STAFF
 */
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  await orderService.expirePendingOrders();

  const result = await orderService.getAllOrdersAdmin(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách đơn hàng thành công', result);
});

/**
 * Controller: Admin cập nhật trạng thái đơn hàng
 * PATCH /api/admin/orders/:id
 * Quyền: ADMIN, STAFF
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật trạng thái đơn hàng thành công', order);
});

module.exports = {
  checkout,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatus,
};
