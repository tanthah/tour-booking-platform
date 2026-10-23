import axiosClient from '../../config/axiosClient';

/**
 * Coupon Service (Client) - Gọi các API liên quan đến Mã giảm giá
 * Tuân thủ rangbuoc.txt: bọc try-catch, kiểm tra lỗi
 */
export const getPublicCoupons = async () => {
  try {
    const res = await axiosClient.get('/coupons/public');
    // axiosClient unwrap response.data -> res là { success: true, message: ..., data: [...] }
    return res?.data || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách mã giảm giá công khai:', error);
    throw error;
  }
};

/**
 * Kiểm tra mã coupon trước khi đặt tour
 * @param {string} code - Mã coupon
 * @param {number} subtotal - Tổng tiền đơn
 */
export const validateCouponCode = async (code, subtotal) => {
  try {
    const res = await axiosClient.post('/coupons/validate', {
      code: code.trim().toUpperCase(),
      subtotal: Number(subtotal),
    });
    return res?.data || res;
  } catch (error) {
    console.error('Lỗi khi kiểm tra mã coupon:', error);
    throw error;
  }
};
