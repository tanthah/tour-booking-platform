const mongoose = require('mongoose');

/**
 * CardEmailLog Schema — Lưu vết và chống gửi trùng email thông báo thiệp điện tử (BR09, BR10, BR11, BR19)
 */
const cardEmailLogSchema = new mongoose.Schema(
  {
    card_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SouvenirCard',
      required: [true, 'Card ID là bắt buộc'],
      index: true,
    },
    recipient_email: {
      type: String,
      required: [true, 'Email người nhận là bắt buộc'],
      trim: true,
      lowercase: true,
    },
    recipient_name: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Tiêu đề email là bắt buộc'],
      trim: true,
    },
    delivery_status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    idempotency_key: {
      type: String,
      required: [true, 'Idempotency key là bắt buộc để chống gửi trùng'],
      unique: true,
      index: true,
    },
    retry_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    provider_message_id: {
      type: String,
      default: null,
    },
    last_error: {
      type: String,
      default: null,
    },
    queued_at: {
      type: Date,
      default: Date.now,
    },
    sent_at: {
      type: Date,
      default: null,
    },
    triggered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

cardEmailLogSchema.index({ recipient_email: 1, created_at: -1 });

const CardEmailLog = mongoose.models.CardEmailLog || mongoose.model('CardEmailLog', cardEmailLogSchema);

module.exports = CardEmailLog;

