const mongoose = require('mongoose');

/**
 * JourneyNotification Schema — Lưu thông báo trên website cho khách hàng theo dõi hành trình
 * Tự động xóa sau 30 ngày nhờ TTL index.
 */
const journeyNotificationSchema = new mongoose.Schema(
  {
    journey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourJourney',
      required: [true, 'journey_id là bắt buộc'],
      index: true,
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'recipient_id là bắt buộc'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'STATUS_UPDATE',
        'SCHEDULE_CHANGE',
        'JOURNEY_STARTED',
        'JOURNEY_COMPLETED',
        'JOURNEY_CANCELLED',
      ],
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Nội dung thông báo là bắt buộc'],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

journeyNotificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });
journeyNotificationSchema.index({ journey_id: 1, recipient_id: 1, created_at: -1 });
// TTL index: giữ thông báo trong 30 ngày (2592000 giây)
journeyNotificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 2592000 });

const JourneyNotification =
  mongoose.models.JourneyNotification ||
  mongoose.model('JourneyNotification', journeyNotificationSchema);

module.exports = JourneyNotification;

