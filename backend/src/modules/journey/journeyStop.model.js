const mongoose = require('mongoose');

/**
 * JourneyStop Schema — Một điểm dừng/địa điểm tham quan thực tế trong TourJourney
 * Không ghi đè lịch trình mẫu của Tour; mọi điều chỉnh thực tế lưu tại đây.
 */
const journeyStopSchema = new mongoose.Schema(
  {
    journey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourJourney',
      required: [true, 'Hành trình (journey_id) là bắt buộc'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên địa điểm là bắt buộc'],
      trim: true,
      maxlength: [255, 'Tên địa điểm không được vượt quá 255 ký tự'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Mô tả ngắn không được vượt quá 1000 ký tự'],
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Địa chỉ không được vượt quá 500 ký tự'],
    },
    latitude: {
      type: Number,
      required: [true, 'Vĩ độ (latitude) là bắt buộc'],
      min: [-90, 'Vĩ độ phải >= -90'],
      max: [90, 'Vĩ độ phải <= 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Kinh độ (longitude) là bắt buộc'],
      min: [-180, 'Kinh độ phải >= -180'],
      max: [180, 'Kinh độ phải <= 180'],
    },
    order: {
      type: Number,
      required: [true, 'Thứ tự điểm dừng là bắt buộc'],
      min: [0, 'Thứ tự phải >= 0'],
    },
    day_number: {
      type: Number,
      default: 1,
      min: [1, 'Ngày thứ phải >= 1'],
    },
    planned_start: {
      type: Date,
      default: null,
    },
    planned_end: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'TRAVELLING', 'VISITING', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING',
      index: true,
    },
    departed_at: {
      type: Date,
      default: null,
    },
    arrived_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    skipped_reason: {
      type: String,
      default: '',
      trim: true,
    },
    is_additional: {
      type: Boolean,
      default: false,
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự'],
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

journeyStopSchema.index({ journey_id: 1, order: 1 });

const JourneyStop = mongoose.models.JourneyStop || mongoose.model('JourneyStop', journeyStopSchema);

module.exports = JourneyStop;

