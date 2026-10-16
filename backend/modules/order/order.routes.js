const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  checkoutValidation,
  getOrderByIdValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
  listOrdersQueryValidation,
} = require('./order.validation');

// ============ CUSTOMER ROUTES (/api/orders) ============

// Tất cả route đơn hàng customer đều yêu cầu đăng nhập
const customerAuth = [authenticate, authorize('CUSTOMER', 'ADMIN', 'STAFF')];

// Checkout: tạo đơn từ giỏ hàng, tính lại giá, trừ chỗ
router.post(
  '/',
  ...customerAuth,
  checkoutValidation,
  orderController.checkout
);

// Lịch sử đơn hàng của chính mình (phân trang)
router.get(
  '/',
  ...customerAuth,
  listOrdersQueryValidation,
  orderController.getMyOrders
);

// Chi tiết đơn hàng (chủ đơn hoặc ADMIN/STAFF)
router.get(
  '/:id',
  ...customerAuth,
  getOrderByIdValidation,
  orderController.getOrderDetail
);

// Khách tự hủy đơn đang chờ thanh toán
router.patch(
  '/:id/cancel',
  ...customerAuth,
  cancelOrderValidation,
  orderController.cancelOrder
);

// ============ ADMIN/STAFF ROUTES (/api/orders/admin) ============

const adminAuth = [authenticate, authorize('ADMIN', 'STAFF')];

// Danh sách tất cả đơn hàng (phân trang, lọc, tìm kiếm)
router.get(
  '/admin/list',
  ...adminAuth,
  listOrdersQueryValidation,
  orderController.getAllOrdersAdmin
);

// Cập nhật trạng thái đơn hàng (order_status, payment_status)
router.patch(
  '/admin/:id',
  ...adminAuth,
  updateOrderStatusValidation,
  orderController.updateOrderStatus
);

module.exports = router;
