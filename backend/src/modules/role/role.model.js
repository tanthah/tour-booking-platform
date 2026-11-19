const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên vai trò là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên vai trò không được vượt quá 100 ký tự'],
    },
    code: {
      type: String,
      required: [true, 'Mã vai trò là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, 'Mã vai trò chỉ chứa chữ thường, số và dấu gạch dưới'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [255, 'Mô tả không được vượt quá 255 ký tự'],
    },
    is_system: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

roleSchema.index({ is_active: 1 });

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

module.exports = Role;
