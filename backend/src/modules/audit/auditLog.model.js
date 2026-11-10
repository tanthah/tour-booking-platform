const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người thực hiện hành động là bắt buộc'],
    },
    target_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: [true, 'Hành động là bắt buộc'],
      trim: true,
    },
    resource: {
      type: String,
      required: [true, 'Tài nguyên bị tác động là bắt buộc'],
      trim: true,
    },
    old_value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    new_value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    ip_address: {
      type: String,
      default: '',
      trim: true,
    },
    user_agent: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

auditLogSchema.index({ actor_user_id: 1, created_at: -1 });
auditLogSchema.index({ target_user_id: 1, created_at: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ created_at: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
