const mongoose = require('mongoose');

const notificationEmailLogSchema = new mongoose.Schema(
  {
    event_key: { type: String, required: true, unique: true, index: true },
    event_type: { type: String, required: true, index: true },
    recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recipient_email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ['SENDING', 'SENT', 'FAILED'],
      default: 'SENDING',
      index: true,
    },
    provider_message_id: { type: String, default: null },
    last_error: { type: String, default: null },
    sent_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

notificationEmailLogSchema.index({ recipient_email: 1, created_at: -1 });

module.exports = mongoose.models.NotificationEmailLog
  || mongoose.model('NotificationEmailLog', notificationEmailLogSchema);
