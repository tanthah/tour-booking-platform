const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const ctrl = require('./notification.controller');

// Tất cả endpoint đều yêu cầu đăng nhập
router.use(authenticate);

// Lấy danh sách thông báo (phân trang)
// GET /api/notifications?page=1&limit=20
router.get('/', ctrl.getMyNotifications);

// Lấy số thông báo chưa đọc (badge)
// GET /api/notifications/unread-count
router.get('/unread-count', ctrl.getUnreadCount);

// Đánh dấu tất cả đã đọc
// PATCH /api/notifications/read-all
router.patch('/read-all', ctrl.markAllAsRead);

// Đánh dấu 1 thông báo đã đọc
// PATCH /api/notifications/:id/read
router.patch('/:id/read', ctrl.markAsRead);

// Xóa 1 thông báo
// DELETE /api/notifications/:id
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
