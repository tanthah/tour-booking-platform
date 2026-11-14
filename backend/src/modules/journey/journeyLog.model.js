const mongoose = require('mongoose');

/**
 * JourneyLog Schema — Lưu vết toàn bộ thay đổi trạng thái và điều chỉnh lịch trình
 * Không bao giờ xóa hoặc ghi đè lịch sử cũ.
 */
const journeyLogSchema = new mongoose.Schema(
  {
    journey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourJourney',
      required: [true, 'journey_id là bắt buộc'],
      index: true,
    },
    stop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JourneyStop',
      default: null,
      index: true,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'performed_by là bắt buộc'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'action là bắt buộc'],
      enum: [
        'JOURNEY_CREATED',
        'JOURNEY_STARTED',
        'JOURNEY_COMPLETED',
        'JOURNEY_CANCELLED',
        'STOP_STATUS_CHANGED',
        'STOP_REORDERED',
        'STOP_SKIPPED',
        'STOP_ADDED',
        'STOP_REMOVED',
        'STOP_TIME_ADJUSTED',
        'STOP_NOTE_UPDATED',
        'GUIDE_ASSIGNED',
        'GUIDE_CHANGED',
        'ADMIN_INTERVENTION',
      ],
      index: true,
    },
    old_value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    new_value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

journeyLogSchema.index({ journey_id: 1, created_at: -1 });

const JourneyLog = mongoose.models.JourneyLog || mongoose.model('JourneyLog', journeyLogSchema);

module.exports = JourneyLog;

