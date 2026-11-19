const express = require('express');
const router = express.Router();
const couponController = require('./coupon.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  createCouponValidation,
  updateCouponValidation,
  couponIdValidation,
  changeCouponStatusValidation,
  listCouponsValidation,
  validateCouponInput,
} = require('./coupon.validation');

// ============ CUSTOMER ROUTES — Khách hàng sử dụng coupon ============

// Lấy danh sách mã giảm giá công khai đang áp dụng (cho trang ưu đãi)
router.get('/public', couponController.getPublicCoupons);
router.get('/available', couponController.getPublicCoupons);

// Kiểm tra và tính mức giảm giá cho mã coupon (cần đăng nhập)
router.post('/validate', authenticate, validateCouponInput, couponController.validateCoupon);

// Gợi ý mã giảm giá tốt nhất cho đơn hàng hiện tại (Giai đoạn 6)
router.post('/recommend', authenticate, couponController.recommendBestCoupon);

// ============ ADMIN ROUTES — Quản lý coupon & Báo cáo ============

// Báo cáo thống kê hiệu quả chiến dịch (Giai đoạn 5)
router.get('/admin/report', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponController.getCouponReport);

// Toàn bộ lịch sử sử dụng có lọc & xuất CSV (Giai đoạn 5)
router.get('/admin/usages/all', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponController.getAllUsages);
router.get('/admin/usages/export', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponController.exportUsagesCsv);

// Lấy danh sách tất cả coupon (phân trang, lọc, tìm kiếm)
router.get('/admin', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), listCouponsValidation, couponController.getAllCoupons);

// Tạo coupon mới
router.post('/admin', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), createCouponValidation, couponController.createCoupon);

// Phát hành coupon theo lô (Giai đoạn 5)
router.post('/admin/batch', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), couponController.createBatchCoupons);

// Lấy chi tiết coupon theo ID
router.get('/admin/:id', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponIdValidation, couponController.getCouponById);

// Cập nhật thông tin coupon
router.patch('/admin/:id', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), updateCouponValidation, couponController.updateCoupon);

// Đổi trạng thái coupon (ACTIVE / INACTIVE)
router.patch('/admin/:id/status', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), changeCouponStatusValidation, couponController.changeStatus);

// Xóa mềm coupon
router.delete('/admin/:id', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), couponIdValidation, couponController.deleteCoupon);

// Xem lịch sử sử dụng của một coupon cụ thể
router.get('/admin/:id/usages', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponIdValidation, couponController.getCouponUsages);

module.exports = router;
