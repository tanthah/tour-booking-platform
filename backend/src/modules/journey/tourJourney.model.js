const mongoose = require('mongoose');

/**
 * TourJourney Schema — Hành trình thực tế của một đợt khởi hành (TourDeparture)
 * Quan hệ 1-1 với TourDeparture. Tách biệt hoàn toàn khỏi Tour.itinerary mẫu.
 * Hỗ trợ Optimistic Concurrency Control qua trường version.
 */
const tourJourneySchema = new mongoose.Schema(
  {
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourDeparture',
      required: [true, 'Đợt khởi hành (departure_id) là bắt buộc'],
      unique: true,
    },
    tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour (tour_id) là bắt buộc'],
      index: true,
    },
    guide_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'NOT_STARTED',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Tiến độ phải >= 0'],
      max: [100, 'Tiến độ phải <= 100'],
    },
    started_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    cancelled_at: {
      type: Date,
      default: null,
    },
    cancel_reason: {
      type: String,
      default: '',
      trim: true,
    },
    version: {
      type: Number,
      default: 0,
    },
    deleted_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourJourneySchema.index({ guide_id: 1, status: 1 });
tourJourneySchema.index({ created_at: -1 });

const TourJourney = mongoose.models.TourJourney || mongoose.model('TourJourney', tourJourneySchema);

module.exports = TourJourney;

