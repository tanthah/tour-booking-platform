const mongoose = require('mongoose');

/**
 * BookingCustomer Schema — Thông tin khách đi tour
 * Mỗi khách phải gắn đúng một order_item_id để biết ai đi tour nào trong đơn nhiều tour
 * Trường id_number là dữ liệu cá nhân nhạy cảm: hạn chế thu thập, phân quyền xem, không log
 */
const bookingCustomerSchema = new mongoose.Schema(
  {
    // Tham chiếu đến item trong đơn mà khách này đi
    order_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'order_item_id là bắt buộc — phải gắn khách vào đúng tour item'],
    },
    full_name: {
      type: String,
      required: [true, 'Họ tên khách là bắt buộc'],
      trim: true,
      maxlength: [255, 'Họ tên không được quá 255 ký tự'],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại khách là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: null,
    },
    // CCCD/CMND
    id_number: {
      type: String,
      default: null,
      trim: true,
    },
    note: {
      type: String,
      default: '',
      maxlength: [500, 'Ghi chú không được quá 500 ký tự'],
    },
  },
  { _id: true, timestamps: { createdAt: 'created_at', updatedAt: false } }
);

/**
 * OrderItem Schema — Snapshot tour trong đơn (giá + tên tại thời điểm đặt)
 * Giá lưu ở đây là price_snapshot, KHÔNG thay đổi khi admin sửa giá tour sau này
 */
const orderItemSchema = new mongoose.Schema(
  {
    tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour ID là bắt buộc'],
    },
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourDeparture',
      default: null,
    },
    // ========== SNAPSHOT — Lưu tại thời điểm đặt ==========
    tour_name: {
      type: String,
      required: [true, 'Tên tour là bắt buộc'],
    },
    tour_code: {
      type: String,
      default: '',
    },
    main_image: {
      type: String,
      default: '',
    },
    departure_date: {
      type: Date,
      default: null,
    },
    departure_location: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    // ========== GIÁ SNAPSHOT ==========
    price_adult: {
      type: Number,
      required: [true, 'Giá người lớn là bắt buộc'],
      min: [0, 'Giá phải >= 0'],
    },
    price_child: {
      type: Number,
      default: 0,
      min: [0, 'Giá phải >= 0'],
    },
    price_baby: {
      type: Number,
      default: 0,
      min: [0, 'Giá phải >= 0'],
    },
    // ========== SỐ LƯỢNG ==========
    quantity_adult: {
      type: Number,
      required: true,
      min: [1, 'Số lượng người lớn phải >= 1'],
    },
    quantity_child: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng trẻ em phải >= 0'],
    },
    quantity_baby: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng em bé phải >= 0'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Tổng số lượng phải >= 1'],
    },
    // Backend tự tính: (price_adult * qty_adult) + (price_child * qty_child) + (price_baby * qty_baby)
    subtotal: {
      type: Number,
      required: [true, 'Subtotal item là bắt buộc'],
      min: [0, 'Subtotal phải >= 0'],
    },
  },
  { _id: true, timestamps: { createdAt: 'created_at', updatedAt: false } }
);

/**
 * Order Schema — Đơn đặt tour (Aggregate Root)
 * payment_status và order_status là HAI trường riêng biệt, KHÔNG gộp
 * Backend tự tính subtotal, discount_amount, total_amount; KHÔNG tin số tiền từ frontend
 */
const orderSchema = new mongoose.Schema(
  {
    // Mã đơn hiển thị — tự sinh duy nhất (VD: ORD-20261011-XXXX)
    order_code: {
      type: String,
      unique: true,
      required: [true, 'Mã đơn hàng là bắt buộc'],
    },
    // Khách đặt đơn
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
    },
    // ========== THÔNG TIN NGƯỜI ĐẶT ==========
    customer_info: {
      full_name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true },
      note: { type: String, default: '' },
    },
    // ========== DANH SÁCH TOUR & KHÁCH ==========
    items: [orderItemSchema],
    booking_customers: [bookingCustomerSchema],
    // ========== TIỀN — Backend tự tính ==========
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal phải >= 0'],
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount phải >= 0'],
    },
    total_amount: {
      type: Number,
      required: true,
      min: [0, 'Total phải >= 0'],
    },
    // Coupon (chưa có module coupon, để null)
    coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    coupon_code: {
      type: String,
      default: null,
    },
    // ========== THANH TOÁN ==========
    payment_method: {
      type: String,
      required: true,
      default: 'COUNTER',
    },
    // Mức thanh toán: FULL (100%) hoặc DEPOSIT_30 (cọc 30%)
    payment_type: {
      type: String,
      enum: ['FULL', 'DEPOSIT_30', 'DEPOSIT'],
      default: 'FULL',
    },
    deposit_amount: {
      type: Number,
      default: null,
      min: [0, 'Số tiền đặt cọc phải >= 0'],
    },
    paid_amount: {
      type: Number,
      default: 0,
      min: [0, 'Số tiền đã trả phải >= 0'],
    },
    remaining_amount: {
      type: Number,
      default: 0,
      min: [0, 'Số tiền còn thiếu phải >= 0'],
    },
    payment_deadline: {
      type: Date,
      default: null,
    },
    payment_status: {
      type: String,
      enum: ['PENDING', 'DEPOSIT_PAID', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      required: true,
    },
    // ========== TRẠNG THÁI ĐƠN ==========
    order_status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'DEPOSIT_CONFIRMED',
        'CONFIRMED',
        'AWAITING_STAFF',
        'CANCELLED',
        'COMPLETED',
      ],
      default: 'PENDING_PAYMENT',
      required: true,
    },
    payment_expires_at: {
      type: Date,
      default: null,
    },
    cancel_reason: {
      type: String,
      default: null,
    },
    // ========== HỦY & HOÀN TIỀN ==========
    cancel_type: {
      type: String,
      enum: ['CUSTOMER', 'COMPANY', 'STAFF'],
      default: null,
    },
    cancel_fee_percent: {
      type: Number,
      default: null,
    },
    cancel_fee_amount: {
      type: Number,
      default: null,
      min: [0, 'Phí hủy phải >= 0'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// ========== INDEX ==========
orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ payment_expires_at: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
