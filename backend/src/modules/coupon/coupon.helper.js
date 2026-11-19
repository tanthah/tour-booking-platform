const crypto = require('crypto');
const Tour = require('../tour/tour.model');
const Order = require('../order/order.model');

/**
 * Xác định mùa du lịch từ ngày khởi hành (hoặc ngày hiện tại)
 * Tháng 3, 4, 5: SPRING (Mùa xuân)
 * Tháng 6, 7, 8: SUMMER (Mùa hè)
 * Tháng 9, 10, 11: AUTUMN (Mùa thu)
 * Tháng 12, 1, 2: WINTER (Mùa đông)
 */
const getSeasonFromDate = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  const month = d.getMonth() + 1;
  if ([3, 4, 5].includes(month)) return 'SPRING';
  if ([6, 7, 8].includes(month)) return 'SUMMER';
  if ([9, 10, 11].includes(month)) return 'AUTUMN';
  return 'WINTER';
};

/**
 * Sinh danh sách mã giảm giá theo lô (Batch Code Generator)
 * @param {string} prefix Tiền tố mã (VD: 'SUMMER2026')
 * @param {number} count Số lượng mã cần sinh (1 - 500)
 * @returns {string[]} Mảng mã duy nhất
 */
const generateBatchCodes = (prefix, count = 10) => {
  const cleanPrefix = (prefix || 'VOUCHER').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const codes = new Set();
  const maxAttempts = count * 20;
  let attempts = 0;

  while (codes.size < count && attempts < maxAttempts) {
    attempts++;
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    codes.add(`${cleanPrefix}-${randomPart}`);
  }

  return Array.from(codes);
};

/**
 * Kiểm tra đối tượng khách hàng (user_target)
 * Nếu NEW_USER: Khách chưa có đơn CONFIRMED hoặc COMPLETED nào
 */
const validateUserTarget = async (coupon, userId) => {
  if (coupon.user_target !== 'NEW_USER') return;

  const orderCount = await Order.countDocuments({
    user_id: userId,
    order_status: { $in: ['CONFIRMED', 'COMPLETED', 'PENDING_PAYMENT'] },
  });

  if (orderCount > 0) {
    const err = new Error('Mã giảm giá này chỉ áp dụng cho khách hàng mới (chưa từng đặt tour).');
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Trích xuất danh sách tour items từ context
 */
const extractTourItems = (context) => {
  if (Array.isArray(context.orderItems) && context.orderItems.length > 0) {
    return context.orderItems.map((item) => ({
      tour_id: item.tour_id?.toString() || item.tour_id,
      subtotal: item.subtotal || 0,
      departure_date: item.departure_date,
    }));
  }

  if (Array.isArray(context.items) && context.items.length > 0) {
    return context.items.map((item) => ({
      tour_id: (item.tour_id?._id || item.tour_id || item.product_id)?._id?.toString() ||
        (item.tour_id?._id || item.tour_id || item.product_id)?.toString(),
      subtotal: item.item_total || item.subtotal || 0,
      departure_date: item.departure_date,
    }));
  }

  return [];
};

/**
 * Kiểm tra phạm vi áp dụng (applies_to) cho tour / danh mục / mùa
 * Trả về eligibleSubtotal (tiền các tour thỏa mãn điều kiện)
 */
const validateCouponScope = async (coupon, userId, totalSubtotal, context = {}) => {
  // 1. Kiểm tra đối tượng khách hàng (Khách mới)
  await validateUserTarget(coupon, userId);

  // 2. Nếu áp dụng cho tất cả tour
  if (!coupon.applies_to || coupon.applies_to === 'ALL') {
    return { eligibleSubtotal: totalSubtotal };
  }

  const tourItems = extractTourItems(context);

  // Nếu không có thông tin chi tiết tour trong context (chỉ validate nhanh), tạm tính theo totalSubtotal
  if (tourItems.length === 0) {
    return { eligibleSubtotal: totalSubtotal };
  }

  // Lấy chi tiết tour từ DB để đối chiếu category và metadata
  const tourIds = tourItems.map((it) => it.tour_id).filter(Boolean);
  const toursInDb = await Tour.find({ _id: { $in: tourIds } }).select('category title region').lean();
  const tourMap = new Map(toursInDb.map((t) => [t._id.toString(), t]));

  let eligibleSubtotal = 0;

  for (const item of tourItems) {
    const tour = tourMap.get(item.tour_id);
    if (!tour) continue;

    let isEligible = false;

    if (coupon.applies_to === 'CATEGORY') {
      const allowedCategories = coupon.applicable_categories || [];
      if (allowedCategories.length === 0 || allowedCategories.includes(tour.category)) {
        isEligible = true;
      }
    } else if (coupon.applies_to === 'SPECIFIC_TOURS') {
      const allowedIds = (coupon.applicable_tour_ids || []).map((id) => id.toString());
      if (allowedIds.includes(item.tour_id)) {
        isEligible = true;
      }
    } else if (coupon.applies_to === 'SEASON') {
      const allowedSeasons = coupon.applicable_seasons || [];
      const itemSeason = getSeasonFromDate(item.departure_date);
      if (allowedSeasons.length === 0 || allowedSeasons.includes(itemSeason)) {
        isEligible = true;
      }
    }

    if (isEligible) {
      eligibleSubtotal += item.subtotal;
    }
  }

  if (eligibleSubtotal === 0) {
    let scopeDesc = 'các tour được chỉ định';
    if (coupon.applies_to === 'CATEGORY') {
      scopeDesc = `tour ${(coupon.applicable_categories || []).includes('DOMESTIC') ? 'Trong nước' : 'Nước ngoài'}`;
    } else if (coupon.applies_to === 'SEASON') {
      scopeDesc = `tour khởi hành vào mùa ${(coupon.applicable_seasons || []).join(', ')}`;
    }
    const err = new Error(`Mã giảm giá này chỉ áp dụng cho ${scopeDesc}. Các tour trong đơn của bạn không thỏa điều kiện.`);
    err.statusCode = 400;
    throw err;
  }

  return { eligibleSubtotal };
};

module.exports = {
  getSeasonFromDate,
  generateBatchCodes,
  validateUserTarget,
  validateCouponScope,
};
