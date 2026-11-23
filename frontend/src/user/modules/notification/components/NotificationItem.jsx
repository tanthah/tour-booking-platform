import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime, getEventBadge } from '../notificationHelper';
import '../notification.css';

const eventIcons = {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Sparkles,
};

const NotificationItem = ({ notification, compact = false, onMarkRead, onDelete, onOpen }) => {
  const badge = getEventBadge(notification.eventType);
  const Icon = eventIcons[badge.iconName] || Bell;
  const to = notification.link?.startsWith('/')
    ? notification.link
    : '/ho-so-ca-nhan?tab=notifications';

  return (
    <div className={`user-notification-item ${compact ? 'compact' : ''} ${notification.isRead ? '' : 'unread'}`}>
      <Link
        to={to}
        className="user-notification-link"
        onClick={() => {
          if (!notification.isRead) onMarkRead?.(notification._id);
          onOpen?.();
        }}
      >
        <span
          className="user-notification-icon"
          style={{ backgroundColor: badge.bg, color: badge.color }}
          aria-hidden="true"
        >
          <Icon size={compact ? 17 : 19} />
        </span>
        <span className="user-notification-content">
          <span className="user-notification-title">{notification.title || badge.label}</span>
          <span className="user-notification-body">{notification.body}</span>
          <span className="user-notification-time">{formatRelativeTime(notification.createdAt)}</span>
        </span>
        {!notification.isRead && <span className="user-notification-dot" aria-label="Chưa đọc" />}
      </Link>
      {onDelete && (
        <button
          type="button"
          className="user-notification-delete"
          aria-label="Xóa thông báo"
          title="Xóa thông báo"
          onClick={() => onDelete(notification._id)}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export default NotificationItem;
