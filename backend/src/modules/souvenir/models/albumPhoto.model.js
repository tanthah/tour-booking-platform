const mongoose = require('mongoose');

/**
 * AssignedCustomer Subschema — Lưu khách hàng được gắn vào ảnh riêng (n-n)
 */
const assignedCustomerSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    order_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    booking_customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

/**
 * AlbumPhoto Schema — Từng ảnh trong Album kỷ niệm
 * Hỗ trợ phân quyền nghiêm ngặt:
 * - SHARED: Ảnh chung của đoàn (tập thể, địa điểm, hoạt động)
 * - PERSONAL_ONLY: Ảnh riêng, chỉ khách được gắn ảnh và chủ đơn mới có quyền xem (BR05)
 */
const albumPhotoSchema = new mongoose.Schema(
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
    url: {
      type: String,
      required: [true, 'URL ảnh là bắt buộc'],
    },
    thumbnail_url: {
      type: String,
      default: '',
    },
    public_id: {
      type: String,
      required: [true, 'Cloudinary public_id là bắt buộc'],
    },
    original_filename: {
      type: String,
      default: '',
      trim: true,
    },
    file_size: {
      type: Number,
      default: 0,
      min: 0,
    },
    mime_type: {
      type: String,
      default: 'image/jpeg',
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['GROUP', 'LOCATION', 'ACTIVITY', 'PERSONAL'],
      default: 'GROUP',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['SHARED', 'PERSONAL_ONLY'],
      default: 'SHARED',
      index: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Chú thích ảnh không quá 500 ký tự'],
    },
    assigned_customers: [assignedCustomerSchema],
    is_used_in_card: {
      type: Boolean,
      default: false,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sort_order: {
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

// Indexes phục vụ lọc ảnh theo album, phân loại, bảo mật
albumPhotoSchema.index({ album_id: 1, category: 1, deleted_at: 1 });
albumPhotoSchema.index({ album_id: 1, visibility: 1, deleted_at: 1 });
albumPhotoSchema.index({ 'assigned_customers.booking_customer_id': 1, deleted_at: 1 });
albumPhotoSchema.index({ 'assigned_customers.order_id': 1, deleted_at: 1 });
albumPhotoSchema.index({ departure_id: 1, deleted_at: 1 });

const AlbumPhoto = mongoose.models.AlbumPhoto || mongoose.model('AlbumPhoto', albumPhotoSchema);

module.exports = AlbumPhoto;

