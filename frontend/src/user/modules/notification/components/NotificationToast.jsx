import { useEffect } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Sparkles,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../NotificationContext';
import { getEventBadge } from '../notificationHelper';
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

const NotificationToast = () => {
  const { incomingToast, clearIncomingToast, markAsRead } = useNotification();

  useEffect(() => {
    if (!incomingToast) return undefined;
    const timeout = window.setTimeout(clearIncomingToast, 4500);
    return () => window.clearTimeout(timeout);
  }, [incomingToast, clearIncomingToast]);

  if (!incomingToast) return null;

  const to = incomingToast.link?.startsWith('/')
    ? incomingToast.link
    : '/ho-so-ca-nhan?tab=notifications';
  const badge = getEventBadge(incomingToast.eventType);
  const Icon = eventIcons[badge.iconName] || Bell;

  return (
    <div className="notification-toast-container" aria-live="polite" aria-atomic="true">
      <section className="notification-toast-card" role="status">
        <span
          className="notification-toast-icon"
          style={{ color: badge.color, backgroundColor: badge.bg }}
          aria-hidden="true"
        >
          <Icon size={20} />
        </span>
        <div className="notification-toast-main">
          <div className="notification-toast-topline">
            <span className="notification-toast-label">Cập nhật mới</span>
            <span className="notification-toast-time">Vừa xong</span>
            <button
              type="button"
              className="notification-toast-close"
              aria-label="Đóng thông báo"
              onClick={clearIncomingToast}
            >
              <X size={18} />
            </button>
          </div>
          <Link
            to={to}
            className="notification-toast-link"
            onClick={() => {
              if (incomingToast._id) markAsRead(incomingToast._id);
              clearIncomingToast();
            }}
          >
            <strong>{incomingToast.title || 'Bạn có cập nhật mới'}</strong>
            {incomingToast.body && <span>{incomingToast.body}</span>}
            <span className="notification-toast-action">Xem chi tiết <ArrowUpRight size={15} /></span>
          </Link>
        </div>
        <span className="notification-toast-progress" aria-hidden="true" />
      </section>
    </div>
  );
};

export default NotificationToast;
