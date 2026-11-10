const { Coupon, CouponUsage } = require('./coupon.model');
const { validateCouponScope } = require('./coupon.helper');

/**
 * CouponRecommendService — Gợi ý mã giảm giá tối ưu nhất cho khách hàng (Giai đoạn 6)
 * Tự động tính toán các mã hợp lệ và chọn mã đem lại mức giảm cao nhất
 * Tuân thủ rangbuoc.txt: < 300 dòng, try-catch, kiểm tra lỗi
 */
class CouponRecommendService {
  /**
   * Tìm và gợi ý mã giảm giá tốt nhất cho đơn hàng hiện tại
   * @param {string} userId ID của người dùng
   * @param {number} subtotal Tổng tiền tạm tính
   * @param {object} context { tourIds, items }
   */
  async recommendBestCoupon(userId, subtotal, context = {}) {
    const now = new Date();

    // 1. Lấy tất cả mã đang kích hoạt và trong thời gian hiệu lực
    const candidates = await Coupon.find({
      deleted_at: null,
      status: 'ACTIVE',
      start_at: { $lte: now },
      end_at: { $gte: now },
      $or: [{ usage_limit: null }, { $expr: { $lt: ['$used_count', '$usage_limit'] } }],
    }).lean();

    if (!candidates || candidates.length === 0) {
      return { bestCoupon: null, availableCoupons: [] };
    }

    // 2. Lấy số lần user đã dùng từng mã để lọc nhanh
    const userUsages = await CouponUsage.find({
      user_id: userId,
      coupon_id: { $in: candidates.map((c) => c._id) },
      status: { $in: ['RESERVED', 'USED'] },
    }).select('coupon_id').lean();

    const usageCountMap = {};
    userUsages.forEach((u) => {
      const cid = u.coupon_id.toString();
      usageCountMap[cid] = (usageCountMap[cid] || 0) + 1;
    });

    const validCoupons = [];

    // 3. Đánh giá tính hợp lệ và mức giảm của từng mã
    for (const coupon of candidates) {
      const timesUsed = usageCountMap[coupon._id.toString()] || 0;
      if (timesUsed >= coupon.per_user_limit) continue;

      try {
        const { eligibleSubtotal } = await validateCouponScope(coupon, userId, subtotal, context);

        if (coupon.min_order_amount !== null && eligibleSubtotal < coupon.min_order_amount) {
          continue;
        }

        let discountAmount = Math.round((eligibleSubtotal * coupon.discount_percent) / 100);
        if (coupon.max_discount_amount !== null) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
        }

        if (discountAmount > 0) {
          validCoupons.push({
            coupon_id: coupon._id,
            code: coupon.code,
            description: coupon.description,
            discount_percent: coupon.discount_percent,
            max_discount_amount: coupon.max_discount_amount,
            min_order_amount: coupon.min_order_amount,
            user_target: coupon.user_target,
            applies_to: coupon.applies_to,
            end_at: coupon.end_at,
            discount_amount: discountAmount,
          });
        }
      } catch {
        // Bỏ qua mã không khớp điều kiện tour/người dùng
      }
    }

    if (validCoupons.length === 0) {
      return { bestCoupon: null, availableCoupons: [] };
    }

    // 4. Sắp xếp mã theo mức giảm nhiều nhất
    validCoupons.sort((a, b) => b.discount_amount - a.discount_amount);
    const best = validCoupons[0];

    return {
      bestCoupon: best,
      availableCoupons: validCoupons,
      suggestionMessage: `Gợi ý mã tốt nhất: "${best.code}" giúp tiết kiệm ${best.discount_amount.toLocaleString('vi-VN')} đ (-${best.discount_percent}%)`,
    };
  }
}

module.exports = new CouponRecommendService();
