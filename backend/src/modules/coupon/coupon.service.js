const { Coupon, CouponUsage } = require('./coupon.model');
const { validateCouponScope, generateBatchCodes } = require('./coupon.helper');

/**
 * CouponService — Xử lý logic nghiệp vụ Coupon
 * Tính giảm giá, kiểm tra hạn mức, giữ/xác nhận/giải phóng lượt sử dụng, sinh mã theo lô
 */
class CouponService {
  // ============ ADMIN — Quản lý Coupon ============

  /** Tạo coupon mới */
  async createCoupon(data, adminId) {
    const existing = await Coupon.findOne({ code: data.code.trim().toUpperCase() });
    if (existing) {
      const err = new Error('Mã coupon đã tồn tại.');
      err.statusCode = 409;
      throw err;
    }
    return Coupon.create({ ...data, created_by: adminId });
  }

  /** Phát hành mã giảm giá theo lô (Batch Generation) */
  async createBatchCoupons(batchData, adminId) {
    const { prefix, count = 10, ...baseConfig } = batchData;
    const batchId = `BATCH-${Date.now()}`;
    const codes = generateBatchCodes(prefix, Number(count) || 10);
    const docs = codes.map((code) => ({
      ...baseConfig,
      code,
      is_batch: true,
      batch_id: batchId,
      created_by: adminId,
    }));
    await Coupon.insertMany(docs);
    return { batch_id: batchId, total_generated: docs.length, codes };
  }

  /** Lấy danh sách coupon (Admin, phân trang, lọc) */
  async getAllCoupons(queryParams) {
    const { page = 1, limit = 10, status, search, applies_to, user_target } = queryParams;
    const filter = { deleted_at: null };
    if (status) filter.status = status;
    if (applies_to) filter.applies_to = applies_to;
    if (user_target) filter.user_target = user_target;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
      Coupon.countDocuments(filter),
    ]);

    return {
      coupons,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  /** Lấy chi tiết coupon theo ID */
  async getCouponById(couponId) {
    const coupon = await Coupon.findOne({ _id: couponId, deleted_at: null }).lean();
    if (!coupon) {
      const err = new Error('Coupon không tồn tại.');
      err.statusCode = 404;
      throw err;
    }
    return coupon;
  }

  /** Cập nhật coupon (không sửa code và used_count) */
  async updateCoupon(couponId, data) {
    const coupon = await Coupon.findOne({ _id: couponId, deleted_at: null });
    if (!coupon) {
      const err = new Error('Coupon không tồn tại.');
      err.statusCode = 404;
      throw err;
    }
    const safeFields = [
      'description', 'discount_percent', 'max_discount_amount',
      'min_order_amount', 'usage_limit', 'per_user_limit',
      'start_at', 'end_at', 'status',
      'user_target', 'applies_to', 'applicable_categories',
      'applicable_seasons', 'applicable_tour_ids',
    ];
    safeFields.forEach((f) => { if (data[f] !== undefined) coupon[f] = data[f]; });
    await coupon.save();
    return coupon;
  }

  /** Bật/tắt trạng thái coupon */
  async changeStatus(couponId, newStatus) {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: couponId, deleted_at: null },
      { $set: { status: newStatus } },
      { new: true }
    );
    if (!coupon) {
      const err = new Error('Coupon không tồn tại.');
      err.statusCode = 404;
      throw err;
    }
    return coupon;
  }

  /** Xóa mềm coupon */
  async deleteCoupon(couponId) {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: couponId, deleted_at: null },
      { $set: { deleted_at: new Date(), status: 'INACTIVE' } },
      { new: true }
    );
    if (!coupon) {
      const err = new Error('Coupon không tồn tại.');
      err.statusCode = 404;
      throw err;
    }
    return coupon;
  }

  // ============ CUSTOMER — Validate & Tính giảm giá ============

  /**
   * Kiểm tra và tính mức giảm giá cho mã coupon
   * Trả về { coupon, discountAmount, eligibleSubtotal } nếu hợp lệ
   */
  async validateCoupon(userId, code, subtotal, context = {}) {
    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      deleted_at: null,
    }).lean();

    if (!coupon) {
      const err = new Error('Mã giảm giá không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    if (coupon.status !== 'ACTIVE') {
      const err = new Error('Mã giảm giá đã bị vô hiệu hóa.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (now < new Date(coupon.start_at)) {
      const err = new Error('Mã giảm giá chưa đến thời gian áp dụng.');
      err.statusCode = 400;
      throw err;
    }
    if (now > new Date(coupon.end_at)) {
      const err = new Error('Mã giảm giá đã hết hạn.');
      err.statusCode = 400;
      throw err;
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      const err = new Error('Mã giảm giá đã hết lượt sử dụng.');
      err.statusCode = 400;
      throw err;
    }

    const userUsageCount = await CouponUsage.countDocuments({
      coupon_id: coupon._id,
      user_id: userId,
      status: { $in: ['RESERVED', 'USED'] },
    });
    if (userUsageCount >= coupon.per_user_limit) {
      const err = new Error('Bạn đã sử dụng mã giảm giá này đủ số lần cho phép.');
      err.statusCode = 400;
      throw err;
    }

    // Kiểm tra phạm vi áp dụng (khách mới / tour / danh mục / mùa)
    const { eligibleSubtotal } = await validateCouponScope(coupon, userId, subtotal, context);

    if (coupon.min_order_amount !== null && eligibleSubtotal < coupon.min_order_amount) {
      const minFormatted = coupon.min_order_amount.toLocaleString('vi-VN');
      const err = new Error(`Đơn hàng tối thiểu ${minFormatted} đ áp dụng cho tour hợp lệ của mã.`);
      err.statusCode = 400;
      throw err;
    }

    let discountAmount = Math.round((eligibleSubtotal * coupon.discount_percent) / 100);
    if (coupon.max_discount_amount !== null) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }

    return { coupon, discountAmount, eligibleSubtotal };
  }

  // ============ TRANSACTION — Giữ / Xác nhận / Giải phóng lượt ============

  /** Giữ lượt coupon khi tạo đơn */
  async reserveCoupon(couponId, userId, bookingId, discountAmount, session) {
    const updateFilter = { _id: couponId, status: 'ACTIVE', deleted_at: null };
    const updated = await Coupon.findOneAndUpdate(
      {
        ...updateFilter,
        $or: [{ usage_limit: null }, { $expr: { $lt: ['$used_count', '$usage_limit'] } }],
      },
      { $inc: { used_count: 1 } },
      { session: session || undefined, new: true }
    );

    if (!updated) {
      const err = new Error('Mã giảm giá đã hết lượt sử dụng.');
      err.statusCode = 400;
      throw err;
    }

    const usageData = {
      coupon_id: couponId,
      user_id: userId,
      booking_id: bookingId,
      discount_amount: discountAmount,
      status: 'RESERVED',
    };

    if (session) {
      await CouponUsage.create([usageData], { session });
    } else {
      await CouponUsage.create(usageData);
    }
  }

  /** Xác nhận lượt: RESERVED → USED */
  async confirmCouponUsed(bookingId) {
    await CouponUsage.updateMany(
      { booking_id: bookingId, status: 'RESERVED' },
      { $set: { status: 'USED', used_at: new Date() } }
    );
  }

  /** Giải phóng lượt: RESERVED → RELEASED và giảm used_count */
  async releaseCouponReservation(bookingId) {
    const usages = await CouponUsage.find({ booking_id: bookingId, status: 'RESERVED' });
    for (const usage of usages) {
      await Coupon.updateOne(
        { _id: usage.coupon_id, used_count: { $gt: 0 } },
        { $inc: { used_count: -1 } }
      );
      usage.status = 'RELEASED';
      await usage.save();
    }
  }

  /** Lấy lịch sử sử dụng của một coupon (Admin) */
  async getCouponUsages(couponId, queryParams) {
    const { page = 1, limit = 20 } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { coupon_id: couponId };

    const [usages, total] = await Promise.all([
      CouponUsage.find(filter)
        .populate('user_id', 'full_name email phone')
        .populate('booking_id', 'order_code total_amount order_status')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CouponUsage.countDocuments(filter),
    ]);

    return {
      usages,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  /** Lấy danh sách coupon công khai đang hoạt động */
  async getPublicCoupons() {
    const now = new Date();
    const filter = {
      deleted_at: null,
      status: 'ACTIVE',
      start_at: { $lte: now },
      end_at: { $gte: now },
      $or: [{ usage_limit: null }, { $expr: { $lt: ['$used_count', '$usage_limit'] } }],
    };

    return Coupon.find(filter)
      .select('code description discount_percent max_discount_amount min_order_amount start_at end_at usage_limit used_count per_user_limit user_target applies_to applicable_categories applicable_seasons')
      .sort({ discount_percent: -1, created_at: -1 })
      .lean();
  }
}

module.exports = new CouponService();
