const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

wishlistItemSchema.index({ user_id: 1, tour_id: 1 }, { unique: true });

const WishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistItemSchema);

module.exports = WishlistItem;
