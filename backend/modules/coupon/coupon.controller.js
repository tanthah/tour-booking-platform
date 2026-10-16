const { validationResult } = require('express-validator');
const couponService = require('./coupon.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Hàm helper kiểm tra lỗi Validation từ express-validator
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

// ============ ADMIN — Quản lý Coupon ============

/** POST /api/coupons/admin — Tạo coupon mới */
const createCoupon = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const coupon = await couponService.createCoupon(req.body, req.user._id);
  ApiResponse.success(res, 201, 'Tạo mã giảm giá thành công', coupon);
});

/** POST /api/coupons/admin/batch — Phát hành mã giảm giá theo lô */
const createBatchCoupons = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await couponService.createBatchCoupons(req.body, req.user._id);
  ApiResponse.success(res, 201, 'Phát hành lô mã giảm giá thành công', result);
});

/** GET /api/coupons/admin — Danh sách coupon (phân trang, lọc) */
const getAllCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.getAllCoupons(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách mã giảm giá thành công', result);
});

/** GET /api/coupons/admin/:id — Chi tiết coupon */
const getCouponById = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const coupon = await couponService.getCouponById(req.params.id);
  ApiResponse.success(res, 200, 'Lấy chi tiết mã giảm giá thành công', coupon);
});

/** PATCH /api/coupons/admin/:id — Cập nhật coupon */
const updateCoupon = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật mã giảm giá thành công', coupon);
});

/** PATCH /api/coupons/admin/:id/status — Bật/tắt coupon */
const changeStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const coupon = await couponService.changeStatus(req.params.id, req.body.status);
  ApiResponse.success(res, 200, 'Đổi trạng thái mã giảm giá thành công', coupon);
});

/** DELETE /api/coupons/admin/:id — Xóa mềm coupon */
const deleteCoupon = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  await couponService.deleteCoupon(req.params.id);
  ApiResponse.success(res, 200, 'Xóa mã giảm giá thành công');
});

/** GET /api/coupons/admin/:id/usages — Lịch sử sử dụng coupon */
const getCouponUsages = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await couponService.getCouponUsages(req.params.id, req.query);
  ApiResponse.success(res, 200, 'Lấy lịch sử sử dụng thành công', result);
});

// ============ CUSTOMER — Validate Coupon ============

/**
 * POST /api/coupons/validate — Kiểm tra mã coupon và tính mức giảm
 * Frontend gửi { code, subtotal }, backend trả { valid, discountAmount, ... }
 */
const validateCoupon = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const { code, subtotal, tour_ids, items } = req.body;
    const { coupon, discountAmount, eligibleSubtotal } = await couponService.validateCoupon(
      req.user._id,
      code,
      Number(subtotal),
      { tourIds: tour_ids, items }
    );

    const finalTotal = Math.max(0, Number(subtotal) - discountAmount);

    ApiResponse.success(res, 200, 'Áp dụng mã giảm giá thành công', {
      valid: true,
      coupon_id: coupon._id,
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      max_discount_amount: coupon.max_discount_amount,
      discount_amount: discountAmount,
      discountAmount,
      eligible_subtotal: eligibleSubtotal,
      final_total: finalTotal,
      finalTotal,
      description: coupon.description,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        max_discount_amount: coupon.max_discount_amount,
        min_order_amount: coupon.min_order_amount,
      },
    });
  } catch (error) {
    // Trả lỗi nghiệp vụ coupon dạng response chuẩn (không throw 500)
    const statusCode = error.statusCode || 400;
    ApiResponse.error(res, statusCode, error.message);
  }
});

/**
 * GET /api/coupons/public hoặc /api/coupons/available
 * Lấy danh sách mã giảm giá công khai đang có hiệu lực cho trang ưu đãi
 */
const getPublicCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.getPublicCoupons();
  ApiResponse.success(res, 200, 'Lấy danh sách mã giảm giá thành công', coupons);
});

module.exports = {
  createCoupon,
  createBatchCoupons,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  changeStatus,
  deleteCoupon,
  getCouponUsages,
  validateCoupon,
  getPublicCoupons,
};
