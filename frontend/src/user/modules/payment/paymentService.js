import axiosClient from '../../config/axiosClient';

/**
 * Gọi API Backend tạo giao dịch thanh toán ZaloPay (QR động / redirect)
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} [params.paymentType='deposit'] - 'deposit' | 'remaining' | 'full'
 */
export const createZaloPayPayment = async ({ orderId, paymentType = 'deposit' }) => {
  const res = await axiosClient.post('/payments/zalopay/create', {
    orderId,
    paymentType,
  });
  return res.data;
};

/**
 * Truy vấn trạng thái giao dịch thanh toán ZaloPay & thời gian đếm ngược
 * @param {string} paymentId
 */
export const getPaymentStatus = async (paymentId) => {
  const res = await axiosClient.get(`/payments/${paymentId}/status`);
  return res.data;
};

/**
 * Lấy danh sách lịch sử giao dịch ZaloPay của đơn hàng
 * @param {string} orderId
 */
export const getPaymentsByOrder = async (orderId) => {
  const res = await axiosClient.get(`/payments/order/${orderId}`);
  return res.data;
};

export default {
  createZaloPayPayment,
  getPaymentStatus,
  getPaymentsByOrder,
};
