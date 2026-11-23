import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotification();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    fetchNotifications(1, 10);
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, fetchNotifications]);

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="header-notification" ref={dropdownRef}>
      <button
        type="button"
        className="header-noti-btn"
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={23} />
        {unreadCount > 0 && (
          <span className="header-noti-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <section className="header-noti-dropdown" role="dialog" aria-label="Thông báo gần đây">
          <div className="header-noti-heading">
            <strong>Thông báo</strong>
            <button
              type="button"
              className="header-noti-mark-all"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
          <div className="header-noti-list">
            {recentNotifications.length ? recentNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                compact
                onMarkRead={markAsRead}
                onOpen={() => setOpen(false)}
              />
            )) : (
              <p className="header-noti-empty">Bạn chưa có thông báo nào.</p>
            )}
          </div>
          <Link
            to="/ho-so-ca-nhan?tab=notifications"
            className="header-noti-footer"
            onClick={() => setOpen(false)}
          >
            Xem tất cả thông báo
          </Link>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
