/**
 * Booking Policy — Quản lý chính sách đặt tour, đặt cọc, hạn thanh toán và phí hủy
 */

/**
 * Tính số ngày còn lại từ hôm nay đến ngày khởi hành (tính theo ngày tròn)
 */
const getDaysBeforeDeparture = (departureDate) => {
  if (!departureDate) return 0;
  const dep = new Date(departureDate);
  if (isNaN(dep.getTime())) return 0;
  const now = new Date();

  const depMidnight = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((depMidnight - nowMidnight) / (24 * 60 * 60 * 1000));
};

/**
 * Tính ngày D - X (ví dụ D-16 là 16 ngày trước ngày khởi hành)
 * Đặt thời gian cuối ngày 23:59:59 để khách có trọn vẹn ngày đó thanh toán
 */
const getDateDMinus = (departureDate, days) => {
  if (!departureDate) return null;
  const dep = new Date(departureDate);
  if (isNaN(dep.getTime())) return null;

  const targetDate = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate() - days, 23, 59, 59, 999);
  return targetDate;
};

/**
 * Trả về chính sách đặt tour dựa vào ngày khởi hành
 * - daysLeft <= 5: Chặn đặt tour (D-5 -> D-1)
 * - 6 <= daysLeft <= 15: Cho đặt tour, bắt buộc 100%, không cho cọc
 * - daysLeft >= 16: Cho đặt tour, cho phép cọc 30%, hạn thanh toán đủ là D-16
 */
const getBookingPolicy = (departureDate) => {
  const daysLeft = getDaysBeforeDeparture(departureDate);

  if (daysLeft <= 5) {
    return {
      canBook: false,
      allowDeposit: false,
      daysLeft,
      requiredPaymentPercent: null,
      paymentDeadline: null,
      reason: 'Tour khởi hành trong vòng 5 ngày tới, hệ thống đã đóng nhận khách mới để chốt danh sách điều hành.',
    };
  }

  if (daysLeft <= 15) {
    return {
      canBook: true,
      allowDeposit: false,
      daysLeft,
      requiredPaymentPercent: 100,
      paymentDeadline: null,
      reason: 'Tour khởi hành trong vòng 6–15 ngày tới, quý khách vui lòng thanh toán toàn bộ 100% để đảm bảo dịch vụ.',
    };
  }

  // daysLeft >= 16
  const deadline = getDateDMinus(departureDate, 16);
  return {
    canBook: true,
    allowDeposit: true,
    daysLeft,
    requiredPaymentPercent: 30,
    paymentDeadline: deadline,
    reason: '',
  };
};

/**
 * Trả về tỷ lệ % phí hủy tour theo mốc ngày khởi hành
 * - Trước D-20 (còn > 20 ngày): 3%
 * - D-20 -> D-16 (16 <= daysLeft <= 20): 25%
 * - D-15 -> D-11 (11 <= daysLeft <= 15): 50%
 * - D-10 -> D-6 (6 <= daysLeft <= 10): 75%
 * - D-5 -> D-1 hoặc trong ngày (daysLeft <= 5): 100%
 */
const getCancelFeePercent = (departureDate) => {
  const daysLeft = getDaysBeforeDeparture(departureDate);

  if (daysLeft > 20) return 3;
  if (daysLeft >= 16) return 25;
  if (daysLeft >= 11) return 50;
  if (daysLeft >= 6) return 75;
  return 100;
};

/**
 * Tính số tiền phí hủy và số tiền hoàn lại
 * Số tiền hoàn = max(0, paid_amount - cancel_fee_amount)
 */
const calculateRefundAmount = (paidAmount, totalAmount, cancelFeePercent) => {
  const safePaid = Number(paidAmount) || 0;
  const safeTotal = Number(totalAmount) || 0;
  const cancelFeeAmount = Math.round((safeTotal * cancelFeePercent) / 100);
  const refundAmount = Math.max(0, safePaid - cancelFeeAmount);

  return {
    cancelFeePercent,
    cancelFeeAmount,
    refundAmount,
  };
};

/**
 * Tính hạn thanh toán D-16
 */
const calculatePaymentDeadline = (departureDate) => {
  return getDateDMinus(departureDate, 16);
};

module.exports = {
  getDaysBeforeDeparture,
  getDateDMinus,
  getBookingPolicy,
  getCancelFeePercent,
  calculateRefundAmount,
  calculatePaymentDeadline,
};

