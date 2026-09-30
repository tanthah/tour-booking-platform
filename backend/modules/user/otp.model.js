const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp_code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['REGISTER', 'FORGOT_PASSWORD'],
      required: true,
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Đã vượt quá số lần thử cho phép'],
    },
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// TTL Index (Time-To-Live): Tự động xóa document trong MongoDB sau khi expires_at hết hạn
otpVerificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Compound Index giúp tăng tốc độ truy vấn theo email và type
otpVerificationSchema.index({ email: 1, type: 1 });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

module.exports = OtpVerification;
