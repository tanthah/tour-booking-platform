const notificationService = require('./notification.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của user hiện tại (phân trang)
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

    const result = await notificationService.getNotificationsForUser(userId, { page, limit, isRead });

    return ApiResponse.success(res, 200, 'Lấy danh sách thông báo thành công', result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/unread-count
 * Lấy số thông báo chưa đọc (dùng cho badge)
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return ApiResponse.success(res, 200, 'Lấy số thông báo chưa đọc thành công', { unreadCount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Đánh dấu 1 thông báo là đã đọc
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    return ApiResponse.success(res, 200, 'Đã đánh dấu thông báo là đã đọc', { notification });
  } catch (err) {
    if (err.statusCode) return ApiResponse.error(res, err.statusCode, err.message);
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Đánh dấu tất cả thông báo của user là đã đọc
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const modifiedCount = await notificationService.markAllAsRead(req.user._id);
    return ApiResponse.success(res, 200, `Đã đánh dấu ${modifiedCount} thông báo là đã đọc`, { modifiedCount });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:id
 * Xóa 1 thông báo
 */
const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user._id);
    return ApiResponse.success(res, 200, 'Xóa thông báo thành công');
  } catch (err) {
    if (err.statusCode) return ApiResponse.error(res, err.statusCode, err.message);
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
