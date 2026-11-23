import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getMyNotifications,
  getUnreadCount as fetchUnreadCountApi,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
  createNotificationSocket,
} from './notification.api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children, user }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [incomingToast, setIncomingToast] = useState(null);

  const socketRef = useRef(null);

  // 1. Tải số thông báo chưa đọc
  const refreshUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetchUnreadCountApi();
      const count = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch (err) {
      console.warn('[Notification] Lỗi lấy số chưa đọc:', err?.message || err);
    }
  }, [user]);

  // 2. Tải danh sách thông báo phân trang
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    setLoading(true);
    try {
      const res = await getMyNotifications({ page, limit });
      const data = res?.data || res;
      setNotifications(data?.notifications || []);
      if (data?.pagination) {
        setPagination(data.pagination);
      }
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('[Notification] Lỗi tải thông báo:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 3. Đánh dấu 1 thông báo đã đọc
  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (!target || !target.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error('[Notification] Lỗi đánh dấu đã đọc:', err);
      return false;
    }
  }, [notifications]);

  // 4. Đánh dấu tất cả đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error('[Notification] Lỗi đánh dấu tất cả đã đọc:', err);
      return false;
    }
  }, []);

  // 5. Xóa 1 thông báo
  const deleteNotification = useCallback(async (id) => {
    try {
      await deleteNotificationApi(id);
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      return true;
    } catch (err) {
      console.error('[Notification] Lỗi xóa thông báo:', err);
      return false;
    }
  }, [notifications]);

  // 6. Xóa toast notification nhận realtime
  const clearIncomingToast = useCallback(() => {
    setIncomingToast(null);
  }, []);

  // 7. Khởi tạo socket và lắng nghe sự kiện realtime khi user đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setUnreadCount(0);
      setNotifications([]);
      setIncomingToast(null);
      return;
    }

    // Tải dữ liệu ban đầu
    refreshUnreadCount();
    fetchNotifications(1, 10);

    // Kết nối Socket.IO
    const socket = createNotificationSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[NotificationSocket] Connected successfully');
    });

    // Lắng nghe khi có thông báo mới được server emit
    socket.on('notification:new', (newNotif) => {
      console.log('[NotificationSocket] Nhận thông báo mới:', newNotif);

      // Cập nhật số chưa đọc
      setUnreadCount((prev) => prev + 1);

      // Thêm vào danh sách thông báo đầu tiên
      setNotifications((prev) => [newNotif, ...prev]);

      // Kích hoạt toast hiển thị góc màn hình
      setIncomingToast(newNotif);

      // Phát audio nhẹ thông báo (tuỳ chọn)
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {
        // Trình duyệt có thể chặn autoplay
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, refreshUnreadCount, fetchNotifications]);

  const value = {
    unreadCount,
    notifications,
    pagination,
    loading,
    incomingToast,
    refreshUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearIncomingToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification phải được sử dụng bên trong NotificationProvider');
  }
  return context;
};
