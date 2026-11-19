const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const refundController = require('./refund.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  checkoutValidation,
  getOrderByIdValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
  resolveOverdueValidation,
  listOrdersQueryValidation,
} = require('./order.validation');

const customerAuth = [authenticate, authorize('CUSTOMER', 'ADMIN', 'STAFF')];
const adminAuth = [authenticate, authorize('ADMIN', 'STAFF')];

// ============ ADMIN REFUND & ORDER ROUTES (/api/orders/admin/...) ============
// Lưu ý: Đặt trước các route có param /:id để tránh trùng khớp route param

// Danh sách tất cả đơn hàng
router.get('/admin/list', ...adminAuth, listOrdersQueryValidation, orderController.getAllOrdersAdmin);

// Danh sách tất cả yêu cầu hoàn tiền
router.get('/admin/refunds', ...adminAuth, refundController.getAllRefundsAdmin);

// Thao tác hoàn tiền
router.patch('/admin/refunds/:refundId/process', ...adminAuth, refundController.processRefund);
router.patch('/admin/refunds/:refundId/complete', ...adminAuth, refundController.completeRefund);
router.patch('/admin/refunds/:refundId/fail', ...adminAuth, refundController.failRefund);

// Admin xác nhận đặt cọc 30%
router.patch('/admin/:id/confirm-deposit', ...adminAuth, getOrderByIdValidation, orderController.confirmDeposit);

// Công ty hủy tour (hoàn 100%)
router.patch('/admin/:id/company-cancel', ...adminAuth, getOrderByIdValidation, orderController.companyCancel);

// Nhân viên xử lý đơn quá hạn (Gia hạn / Hủy / Xác nhận đủ tiền)
router.patch('/admin/:id/resolve', ...adminAuth, resolveOverdueValidation, orderController.resolveOverdue);

// Nhân viên thêm ghi chú nội bộ
router.post('/admin/:id/notes', ...adminAuth, getOrderByIdValidation, orderController.addOrderNote);

// Cập nhật trạng thái đơn thông thường
router.patch('/admin/:id', ...adminAuth, updateOrderStatusValidation, orderController.updateOrderStatus);

// ============ CUSTOMER / DETAIL ROUTES (/api/orders/...) ============

// Checkout
router.post('/', ...customerAuth, checkoutValidation, orderController.checkout);

// Lịch sử đơn hàng của tôi
router.get('/', ...customerAuth, listOrdersQueryValidation, orderController.getMyOrders);

// Lịch sử hoàn tiền của một đơn
router.get('/:id/refunds', ...customerAuth, getOrderByIdValidation, refundController.getOrderRefunds);

// Xem nhật ký xử lý của đơn (chủ đơn hoặc nhân viên)
router.get('/:id/logs', ...customerAuth, getOrderByIdValidation, orderController.getOrderLogs);

// Chi tiết đơn hàng
router.get('/:id', ...customerAuth, getOrderByIdValidation, orderController.getOrderDetail);

// Khách tự hủy đơn
router.patch('/:id/cancel', ...customerAuth, cancelOrderValidation, orderController.cancelOrder);

module.exports = router;
