const Review = require('./review.model');
const mongoose = require('mongoose');

class ReviewService {
  /**
   * Lấy danh sách đánh giá của 1 Tour (Public) kèm thống kê rating
   */
  async getReviewsByTour(tourId, queryParams = {}) {
    const { page = 1, limit = 10, rating } = queryParams;

    const filter = {
      tour_id: new mongoose.Types.ObjectId(tourId),
      status: 'approved',
      deleted_at: null,
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .populate('user_id', 'full_name avatar email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(filter),
      this.getReviewStats(tourId),
    ]);

    return {
      reviews,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Thống kê đánh giá của 1 Tour (điểm trung bình, phân bố sao)
   */
  async getReviewStats(tourId) {
    const objectId = new mongoose.Types.ObjectId(tourId);

    const aggregateResult = await Review.aggregate([
      {
        $match: {
          tour_id: objectId,
          status: 'approved',
          deleted_at: null,
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let totalScore = 0;

    aggregateResult.forEach((item) => {
      if (item._id >= 1 && item._id <= 5) {
        distribution[item._id] = item.count;
        totalReviews += item.count;
        totalScore += item._id * item.count;
      }
    });

    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;

    return {
      averageRating,
      totalReviews,
      distribution,
    };
  }

  /**
   * Tạo đánh giá mới cho Tour (User đăng nhập)
   */
  async createReview(userId, data) {
    const { tour_id, order_id, rating, comment, images = [] } = data;

    const review = await Review.create({
      tour_id,
      user_id: userId,
      order_id: order_id || null,
      rating,
      comment: comment || '',
      images,
      status: 'approved',
    });

    return review;
  }
}

module.exports = new ReviewService();

