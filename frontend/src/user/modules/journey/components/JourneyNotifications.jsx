import { Bell, CheckCheck } from 'lucide-react';
import { formatDateTimeVN } from '../journeyConstants';

function JourneyNotifications({ notifications = [], onMarkRead, onMarkAllRead }) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="bg-white rounded-4 border shadow-sm p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <Bell size={18} color="#ea580c" />
          <h6 className="mb-0 fw-bold">Thông báo hành trình</h6>
          {unreadCount > 0 && (
            <span className="badge rounded-pill bg-danger">{unreadCount} mới</span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1"
            style={{ color: '#ea580c', fontSize: '12.5px', fontWeight: 600 }}
            onClick={onMarkAllRead}
          >
            <CheckCheck size={14} /> Đánh dấu đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-muted text-center py-3" style={{ fontSize: '13.5px' }}>
          Chưa có cập nhật mới nào cho hành trình này.
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="d-flex flex-column gap-2">
          {notifications.map((notif) => (
            <div
              key={notif._id || `${notif.title}-${notif.created_at}`}
              onClick={() => !notif.is_read && notif._id && onMarkRead && onMarkRead(notif._id)}
              className="p-2 px-3 rounded-3"
              style={{
                backgroundColor: notif.is_read ? '#f8fafc' : '#fff7ed',
                border: notif.is_read ? '1px solid #e2e8f0' : '1px solid #fed7aa',
                cursor: notif.is_read ? 'default' : 'pointer',
              }}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div className="fw-bold" style={{ fontSize: '13.5px', color: '#0f172a' }}>
                  {notif.title}
                </div>
                <span className="text-muted" style={{ fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                  {formatDateTimeVN(notif.created_at)}
                </span>
              </div>
              <div className="text-secondary mt-1" style={{ fontSize: '13px' }}>
                {notif.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JourneyNotifications;

