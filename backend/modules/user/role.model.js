const mongoose = require('mongoose');

// Mongoose Schema định nghĩa thông tin Vai trò (Role) và Quyền hạn (Permissions)
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
    },
    description: {
      type: String,
      default: '',
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

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
