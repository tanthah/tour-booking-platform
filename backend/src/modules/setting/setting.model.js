const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    logo_url: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    facebook_url: { type: String, default: '' },
    instagram_url: { type: String, default: '' },
    youtube_url: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
