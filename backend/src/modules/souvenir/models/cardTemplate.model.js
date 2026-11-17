const mongoose = require('mongoose');

/**
 * CardTemplate Schema — Mẫu nội dung và lời chúc cho Thiệp điện tử
 */
const cardTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên mẫu thiệp là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên mẫu không quá 100 ký tự'],
    },
    greeting_template: {
      type: String,
      required: [true, 'Nội dung mẫu lời cảm ơn là bắt buộc'],
      trim: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deleted_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

cardTemplateSchema.index({ is_default: 1, is_active: 1 });

const CardTemplate = mongoose.models.CardTemplate || mongoose.model('CardTemplate', cardTemplateSchema);

module.exports = CardTemplate;

