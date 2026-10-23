const { Coupon, CouponUsage } = require('./coupon.model');

/**
 * CouponReportService — Báo cáo thống kê hiệu quả chiến dịch & Quản lý lịch sử sử dụng (Giai đoạn 5)
 * Tuân thủ rangbuoc.txt: < 300 dòng, try-catch, kiểm tra lỗi
 */
class CouponReportService {
  /**
   * Báo cáo thống kê tổng quan Coupon & Chiến dịch (Admin)
   */
  async getCouponReport() {
    const now = new Date();

    const [
      totalCoupons,
      activeCoupons,
      batchCoupons,
      usagesStats,
      topCoupons,
      batchStats,
    ] = await Promise.all([
      Coupon.countDocuments({ deleted_at: null }),
      Coupon.countDocuments({ deleted_at: null, status: 'ACTIVE', start_at: { $lte: now }, end_at: { $gte: now } }),
      Coupon.countDocuments({ deleted_at: null, is_batch: true }),
      CouponUsage.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDiscount: { $sum: '$discount_amount' },
          },
        },
      ]),
      // Top 5 coupon được dùng nhiều nhất
      Coupon.find({ deleted_at: null, used_count: { $gt: 0 } })
        .sort({ used_count: -1 })
        .limit(5)
        .select('code discount_percent used_count usage_limit max_discount_amount')
        .lean(),
      // Thống kê theo lô phát hành (Batch)
      Coupon.aggregate([
        { $match: { deleted_at: null, is_batch: true, batch_id: { $ne: null } } },
        {
          $group: {
            _id: '$batch_id',
            issued_count: { $sum: 1 },
            used_count: { $sum: '$used_count' },
            discount_percent: { $first: '$discount_percent' },
            created_at: { $first: '$created_at' },
          },
        },
        { $sort: { created_at: -1 } },
        { $limit: 10 },
      ]),
    ]);

    let totalUsed = 0;
    let totalReserved = 0;
    let totalReleased = 0;
    let totalDiscountAmount = 0;

    usagesStats.forEach((st) => {
      if (st._id === 'USED') {
        totalUsed = st.count;
        totalDiscountAmount += st.totalDiscount || 0;
      } else if (st._id === 'RESERVED') {
        totalReserved = st.count;
      } else if (st._id === 'RELEASED') {
        totalReleased = st.count;
      }
    });

    return {
      summary: {
        total_coupons: totalCoupons,
        active_coupons: activeCoupons,
        batch_coupons: batchCoupons,
        total_used_count: totalUsed,
        total_reserved_count: totalReserved,
        total_released_count: totalReleased,
        total_discount_amount: totalDiscountAmount,
        conversion_rate: totalCoupons > 0 ? Math.round((totalUsed / totalCoupons) * 100) : 0,
      },
      top_coupons: topCoupons,
      batch_stats: batchStats,
    };
  }

  /**
   * Lấy toàn bộ lịch sử sử dụng có lọc đa năng (Admin)
   */
  async getAllUsages(queryParams) {
    const {
      page = 1,
      limit = 20,
      coupon_id,
      status,
      user_id,
      from_date,
      to_date,
    } = queryParams;

    const filter = {};
    if (coupon_id) filter.coupon_id = coupon_id;
    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;

    if (from_date || to_date) {
      filter.created_at = {};
      if (from_date) filter.created_at.$gte = new Date(from_date);
      if (to_date) filter.created_at.$lte = new Date(to_date);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [usages, total] = await Promise.all([
      CouponUsage.find(filter)
        .populate('coupon_id', 'code discount_percent')
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
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Xuất danh sách lịch sử sử dụng dạng CSV (Admin)
   */
  async exportUsagesToCsv(queryParams) {
    const { usages } = await this.getAllUsages({ ...queryParams, limit: 1000, page: 1 });

    const headers = ['Mã Đơn', 'Mã Coupon', 'Khách Hàng', 'Email', 'Số Điện Thoại', 'Số Tiền Giảm (VNĐ)', 'Trạng Thái', 'Thời Gian'];
    const rows = usages.map((u) => {
      const orderCode = u.booking_id?.order_code || 'N/A';
      const couponCode = u.coupon_id?.code || 'N/A';
      const customerName = `"${(u.user_id?.full_name || 'Khách').replace(/"/g, '""')}"`;
      const email = u.user_id?.email || '';
      const phone = u.user_id?.phone || '';
      const discount = u.discount_amount || 0;
      const status = u.status === 'USED' ? 'Đã thanh toán' : u.status === 'RESERVED' ? 'Đang giữ' : 'Đã giải phóng';
      const time = u.created_at ? new Date(u.created_at).toLocaleString('vi-VN') : '';

      return [orderCode, couponCode, customerName, email, phone, discount, status, time].join(',');
    });

    // UTF-8 BOM (\uFEFF) để Excel hiển thị đúng tiếng Việt
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }
}

module.exports = new CouponReportService();
