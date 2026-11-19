const mongoose = require('mongoose');

/**
 * Refund Schema — Giao dịch hoàn tiền, liên kết đơn hàng gốc
 * Trạng thái: PENDING → PROCESSING → COMPLETED | FAILED
 * Thời hạn xử lý: 7 ngày làm việc kể từ ngày duyệt
 */
const refundSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID là bắt buộc'],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
    },
    // Số tiền hoàn = max(0, paid_amount - cancel_fee_amount)
    refund_amount: {
      type: Number,
      required: [true, 'Số tiền hoàn là bắt buộc'],
      min: [0, 'Số tiền hoàn phải >= 0'],
    },
    // Phương thức hoàn tiền (theo phương thức thanh toán gốc)
    refund_method: {
      type: String,
      required: [true, 'Phương thức hoàn tiền là bắt buộc'],
    },
    // Mã giao dịch hoàn tiền từ cổng thanh toán (nếu có)
    transaction_id: {
      type: String,
      default: null,
    },
    // Liên kết giao dịch ZaloPay
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    provider: {
      type: String,
      default: 'zalopay',
    },
    m_refund_id: {
      type: String,
      default: null,
    },
    zp_refund_id: {
      type: String,
      default: null,
    },
    return_code: {
      type: Number,
      default: null,
    },
    return_message: {
      type: String,
      default: null,
    },
    // 4 trạng thái theo tài liệu nghiệp vụ
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    // Ngày duyệt yêu cầu hoàn tiền
    approved_at: { type: Date, default: null },
    // Người duyệt
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Ngày hoàn tiền thành công
    completed_at: { type: Date, default: null },
    // Ghi chú nội bộ
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

refundSchema.index({ order_id: 1 });
refundSchema.index({ status: 1 });

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
