import { useEffect, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, CheckCheck, Inbox } from 'lucide-react';
import { getMyNotifications } from '../notification.api';
import { useNotification } from '../NotificationContext';
import NotificationItem from './NotificationItem';
import '../notification.css';

const PAGE_SIZE = 10;

const UserNotificationsList = () => {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getMyNotifications({
      page,
      limit: PAGE_SIZE,
      ...(filter === 'unread' ? { isRead: false } : {}),
    })
      .then((response) => {
        if (!active) return;
        const result = response?.data || response;
        setNotifications(result?.notifications || []);
        setPagination(result?.pagination || { total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Không thể tải thông báo. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [filter, page, refreshKey]);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const handleMarkRead = async (id) => {
    if (await markAsRead(id)) {
      if (filter === 'unread') setRefreshKey((current) => current + 1);
      else {
        setNotifications((current) => current.map((item) => (
          item._id === id ? { ...item, isRead: true } : item
        )));
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (await markAllAsRead()) {
      if (filter === 'unread') setRefreshKey((current) => current + 1);
      else setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    }
  };

  const handleDelete = async (id) => {
    if (await deleteNotification(id)) {
      setNotifications((current) => current.filter((item) => item._id !== id));
      const total = Math.max(0, pagination.total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      setPagination((current) => ({ ...current, total, totalPages: nextTotalPages }));
      if (page > nextTotalPages) setPage(nextTotalPages);
    }
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <section className="user-notifications-page">
      <div className="user-notifications-heading">
        <div>
          <h4><Bell size={21} /> Thông báo</h4>
          <p>Theo dõi cập nhật mới nhất về đơn hàng và chuyến đi của bạn.</p>
        </div>
        <button
          type="button"
          className="user-notifications-mark-all"
          disabled={unreadCount === 0}
          onClick={handleMarkAllRead}
        >
          <CheckCheck size={17} /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="user-notifications-toolbar">
        <div className="user-notifications-filters" role="tablist" aria-label="Lọc thông báo">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'active' : ''}
            onClick={() => handleFilterChange('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'unread'}
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => handleFilterChange('unread')}
          >
            Chưa đọc{unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>
        <span className="user-notifications-total">{pagination.total || 0} thông báo</span>
      </div>

      {error && <div className="user-notifications-error" role="alert">{error}</div>}
      {loading ? (
        <div className="user-notifications-state">Đang tải thông báo…</div>
      ) : notifications.length ? (
        <div className="user-notifications-list">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="user-notifications-state">
          <Inbox size={34} />
          <strong>{filter === 'unread' ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo nào.'}</strong>
          <span>Các cập nhật về đơn hàng và chuyến đi sẽ xuất hiện tại đây.</span>
        </div>
      )}

      <div className="user-notifications-pagination">
        <span>Trang {Math.min(page, totalPages)} / {totalPages}</span>
        <div>
          <button
            type="button"
            aria-label="Trang trước"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Trang sau"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default UserNotificationsList;
