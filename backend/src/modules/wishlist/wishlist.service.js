const WishlistItem = require('./wishlist.model');
const Tour = require('../tour/tour.model');

const getWishlist = async (userId) => {
  const items = await WishlistItem.find({ user_id: userId })
    .sort({ created_at: -1 })
    .populate({
      path: 'tour_id',
      match: { status: 'ACTIVE', deleted_at: null },
      select: 'title code main_image original_price sale_price discount_percent duration destination_location',
    })
    .lean();

  return items
    .filter((item) => item.tour_id)
    .map((item) => ({ ...item.tour_id, saved_at: item.created_at }));
};

const addTour = async (userId, tourId) => {
  const tour = await Tour.findOne({ _id: tourId, status: 'ACTIVE', deleted_at: null }).select('_id');
  if (!tour) {
    const error = new Error('Không tìm thấy tour đang hoạt động.');
    error.statusCode = 404;
    throw error;
  }

  try {
    await WishlistItem.updateOne(
      { user_id: userId, tour_id: tour._id },
      { $setOnInsert: { user_id: userId, tour_id: tour._id } },
      { upsert: true }
    );
  } catch (error) {
    // Unique index makes concurrent repeated saves idempotent.
    if (error.code !== 11000) throw error;
  }

  return tour._id;
};

const removeTour = async (userId, tourId) => {
  await WishlistItem.deleteOne({ user_id: userId, tour_id: tourId });
};

module.exports = { getWishlist, addTour, removeTour };
