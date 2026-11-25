import { io } from 'socket.io-client';
import axiosClient from '../../config/axiosClient';

const SOCKET_URL = 'http://localhost:5000';

/**
 * Lấy danh sách thông báo phân trang của user hiện tại
 */
export const getMyNotifications = (params = { page: 1, limit: 20 }) => {
  return axiosClient.get('/notifications', { params });
};

/**
 * Lấy số lượng thông báo chưa đọc (badge)
 */
export const getUnreadCount = () => {
  return axiosClient.get('/notifications/unread-count');
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export const markNotificationRead = (notificationId) => {
  return axiosClient.patch(`/notifications/${notificationId}/read`);
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllNotificationsRead = () => {
  return axiosClient.patch('/notifications/read-all');
};

/**
 * Xóa 1 thông báo
 */
export const deleteNotification = (notificationId) => {
  return axiosClient.delete(`/notifications/${notificationId}`);
};

/**
 * Khởi tạo kết nối Socket.IO cho thông báo realtime
 */
export const createNotificationSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });
};
