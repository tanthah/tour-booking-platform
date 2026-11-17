const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * ReviewHistoryItem Schema — Lịch sử duyệt/phát hành/thu hồi thiệp (BR12)
 */
const reviewHistoryItemSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['SUBMIT', 'APPROVE', 'REQUEST_REVISION', 'PUBLISH', 'REVOKE', 'RESTORE'],
      required: true,
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from_status: {
      type: String,
      required: true,
    },
    to_status: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * SouvenirCard Schema — Thiệp điện tử kỷ niệm chuyến đi dành riêng cho từng hành khách
 * Khóa duy nhất (order_id, order_item_id, booking_customer_id) (BR03)
 */
const souvenirCardSchema = new mongoose.Schema(
  {
    album_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      required: [true, 'Album ID là bắt buộc'],
      index: true,
    },
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourDeparture',
      required: [true, 'Đợt khởi hành là bắt buộc'],
      index: true,
    },
    tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour ID là bắt buộc'],
      index: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Đơn đặt tour (order_id) là bắt buộc'],
      index: true,
    },
    order_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'order_item_id là bắt buộc'],
    },
    booking_customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'booking_customer_id là bắt buộc'],
    },
    owner_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tài khoản chủ đơn (owner_user_id) là bắt buộc'],
      index: true,
    },
    // Mã ngẫu nhiên duy nhất cho thiệp (không lộ ObjectId dễ đoán)
    public_code: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(10).toString('hex'),
    },
    recipient_name: {
      type: String,
      required: [true, 'Tên người nhận thiệp là bắt buộc'],
      trim: true,
    },
    recipient_email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    // ========== SNAPSHOT THÔNG TIN KHÁCH TẠI THỜI ĐIỂM TẠO ==========
    customer_snapshot: {
      full_name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: null },
      date_of_birth: { type: Date, default: null },
      gender: { type: String, default: null },
    },
    // ========== SNAPSHOT TOUR & LỊCH TRÌNH (BR18 - ĐÃ DUYỆT KHÔNG ĐỔI THEO TOUR) ==========
    tour_info_snapshot: {
      tour_name: { type: String, default: '' },
      tour_code: { type: String, default: '' },
      departure_date: { type: Date, default: null },
      end_date: { type: Date, default: null },
      duration: { type: String, default: '' },
      departure_location: { type: String, default: '' },
      meeting_point: { type: String, default: '' },
    },
    cover_photo: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
      thumbnail_url: { type: String, default: '' },
    },
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CardTemplate',
      default: null,
    },
    greeting_message: {
      type: String,
      default: '',
      trim: true,
    },
    personal_message: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Lời nhắn riêng không quá 2000 ký tự'],
    },
    // Danh sách các ảnh cá nhân gắn riêng cho khách này
    personal_photo_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AlbumPhoto',
      },
    ],
    // ========== TRẠNG THÁI THIỆP & DUYỆT ==========
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_REVIEW',
        'APPROVED',
        'REVISION_REQUESTED',
        'PUBLISHED',
        'REVOKED',
      ],
      default: 'DRAFT',
      index: true,
    },
    review_history: [reviewHistoryItemSchema],
    submitted_at: { type: Date, default: null },
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewed_at: { type: Date, default: null },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    review_comment: { type: String, default: '' },
    published_at: { type: Date, default: null },
    published_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revoked_at: { type: Date, default: null },
    revoked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revoke_reason: { type: String, default: '' },
    // ========== TRẠNG THÁI EMAIL ==========
    email_status: {
      type: String,
      enum: ['NOT_SENT', 'SENDING', 'SENT', 'FAILED', 'NO_EMAIL'],
      default: 'NOT_SENT',
      index: true,
    },
    email_sent_at: { type: Date, default: null },
    // ========== LỊCH SỬ XEM CỦA KHÁCH ==========
    customer_viewed: { type: Boolean, default: false },
    first_viewed_at: { type: Date, default: null },
    view_count: { type: Number, default: 0 },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Khóa duy nhất đảm bảo mỗi khách trong 1 order_item chỉ có 1 thiệp duy nhất (BR03)
souvenirCardSchema.index(
  { order_id: 1, order_item_id: 1, booking_customer_id: 1, deleted_at: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);

souvenirCardSchema.index({ owner_user_id: 1, status: 1, deleted_at: 1 });
souvenirCardSchema.index({ departure_id: 1, status: 1, deleted_at: 1 });
souvenirCardSchema.index({ album_id: 1, status: 1, deleted_at: 1 });

const SouvenirCard = mongoose.models.SouvenirCard || mongoose.model('SouvenirCard', souvenirCardSchema);

module.exports = SouvenirCard;

