const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
      trim: true,
      maxlength: [100, 'Họ và tên không được vượt quá 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
      match: [/^(0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ (VD: 0912345678)'],
    },
    password_hash: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
    },
    avatar_url: {
      type: String,
      default: null,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: null,
    },
    id_number: {
      type: String,
      default: null,
      trim: true,
      maxlength: [20, 'Số CCCD/Hộ chiếu không được vượt quá 20 ký tự'],
    },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'LOCKED'],
      default: 'PENDING_VERIFICATION',
    },
    roles: {
      type: [String],
      default: ['CUSTOMER'],
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    permission_overrides: [
      {
        permission: {
          type: String,
          required: true,
          trim: true,
        },
        effect: {
          type: String,
          enum: ['ALLOW', 'DENY'],
          required: true,
        },
      },
    ],
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Tạo Index cho các trường thường xuyên truy vấn và tìm kiếm
//userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role_id: 1 });
userSchema.index({ status: 1 });
userSchema.index({ deleted_at: 1 });

/**
 * Pre-save Middleware Hook: Tự động mã hóa password thành Bcrypt hash trước khi lưu vào Database
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

/**
 * Instance Method: So sánh mật khẩu dạng plain-text người dùng nhập với Bcrypt hash trong DB
 * @param {string} candidatePassword - Mật khẩu người dùng nhập
 * @returns {Promise<boolean>} Kết quả so sánh đúng/sai
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

/**
 * Overwrite toJSON method: Tự động loại bỏ trường password_hash bảo mật khi serialize sang JSON
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
