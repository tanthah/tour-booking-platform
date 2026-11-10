const mongoose = require('mongoose');

/**
 * CartItem Schema - Chi tiết từng item trong giỏ hàng
 * Mỗi item tương ứng với một tour được thêm vào giỏ
 */
const cartItemSchema = new mongoose.Schema(
  {
    tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour là bắt buộc'],
    },
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourDeparture',
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng là bắt buộc'],
      min: [1, 'Số lượng phải >= 1'],
      default: 1,
    },
    quantity_adult: {
      type: Number,
      min: [1, 'Số lượng người lớn phải >= 1'],
      default: 1,
    },
    quantity_child: {
      type: Number,
      min: [0, 'Số lượng trẻ em phải >= 0'],
      default: 0,
    },
    quantity_baby: {
      type: Number,
      min: [0, 'Số lượng em bé phải >= 0'],
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

/**
 * Cart Schema - Giỏ hàng của khách hàng
 * Mỗi user chỉ có một giỏ hàng ACTIVE tại một thời điểm
 * Khi checkout sẽ chuyển trạng thái sang CHECKED_OUT
 */
const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User là bắt buộc'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CHECKED_OUT', 'ABANDONED'],
      default: 'ACTIVE',
    },
    items: [cartItemSchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Index tìm giỏ hàng ACTIVE của user nhanh hơn
cartSchema.index({ user_id: 1, status: 1 });

// Ràng buộc không cho phép trùng tour_id trong cùng một giỏ hàng
cartSchema.index(
  { 'items.tour_id': 1 },
  { sparse: true }
);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
