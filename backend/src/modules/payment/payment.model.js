const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID là bắt buộc'],
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID là bắt buộc'],
      index: true,
    },
    provider: {
      type: String,
      default: 'zalopay',
    },
    payment_type: {
      type: String,
      enum: ['deposit', 'remaining', 'full'],
      required: [true, 'Loại thanh toán là bắt buộc'],
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền là bắt buộc'],
      min: [0, 'Số tiền phải >= 0'],
    },
    currency: {
      type: String,
      default: 'VND',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'expired', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    app_trans_id: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    zp_trans_id: {
      type: String,
      default: null,
    },
    order_url: {
      type: String,
      default: null,
    },
    zp_trans_token: {
      type: String,
      default: null,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    paid_at: {
      type: Date,
      default: null,
    },
    raw_response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order_id: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

