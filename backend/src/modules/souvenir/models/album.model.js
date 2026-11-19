const mongoose = require('mongoose');

/**
 * Album Schema — Quản lý Album ảnh chung theo từng đợt khởi hành (TourDeparture)
 * Mỗi đợt khởi hành có tối đa 1 album chính (BR02)
 */
const albumSchema = new mongoose.Schema(
  {
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourDeparture',
      required: [true, 'Đợt khởi hành (departure_id) là bắt buộc'],
      index: true,
    },
    tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour (tour_id) là bắt buộc'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Tên album là bắt buộc'],
      trim: true,
      maxlength: [255, 'Tên album không quá 255 ký tự'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Mô tả album không quá 1000 ký tự'],
    },
    cover_photo: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
      thumbnail_url: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    allow_download: {
      type: Boolean,
      default: true,
    },
    photo_count: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng ảnh phải >= 0'],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo album là bắt buộc'],
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

// Đảm bảo mỗi đợt khởi hành chỉ có 1 album hoạt động (chưa xóa)
albumSchema.index(
  { departure_id: 1, deleted_at: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
albumSchema.index({ tour_id: 1, status: 1 });
albumSchema.index({ created_at: -1 });

const Album = mongoose.models.Album || mongoose.model('Album', albumSchema);

module.exports = Album;

