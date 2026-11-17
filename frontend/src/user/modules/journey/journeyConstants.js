export const JOURNEY_STATUS_META = {
  NOT_STARTED: { label: 'Chưa bắt đầu', color: '#64748b', bg: '#f1f5f9', badge: 'secondary' },
  IN_PROGRESS: { label: 'Đang diễn ra', color: '#ea580c', bg: '#fff7ed', badge: 'warning' },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a', bg: '#f0fdf4', badge: 'success' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fef2f2', badge: 'danger' },
};

export const STOP_STATUS_META = {
  PENDING: { label: 'Chưa đến', color: '#64748b', bg: '#f1f5f9', markerBg: '#64748b', badge: 'secondary' },
  TRAVELLING: { label: 'Đang di chuyển', color: '#2563eb', bg: '#eff6ff', markerBg: '#2563eb', badge: 'primary' },
  VISITING: { label: 'Đang tham quan', color: '#ea580c', bg: '#fff7ed', markerBg: '#ea580c', badge: 'warning' },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a', bg: '#f0fdf4', markerBg: '#16a34a', badge: 'success' },
  SKIPPED: { label: 'Đã bỏ qua', color: '#9ca3af', bg: '#f3f4f6', markerBg: '#9ca3af', badge: 'dark' },
};

export const LOG_ACTION_LABELS = {
  JOURNEY_CREATED: 'Khởi tạo hành trình',
  JOURNEY_STARTED: 'Bắt đầu hành trình',
  JOURNEY_COMPLETED: 'Kết thúc hành trình',
  JOURNEY_CANCELLED: 'Hủy hành trình',
  STOP_STATUS_CHANGED: 'Cập nhật trạng thái điểm',
  STOP_REORDERED: 'Đổi thứ tự lịch trình',
  STOP_SKIPPED: 'Bỏ qua địa điểm',
  STOP_ADDED: 'Thêm địa điểm phát sinh',
  STOP_REMOVED: 'Xóa địa điểm',
  STOP_TIME_ADJUSTED: 'Điều chỉnh thời gian dự kiến',
  STOP_NOTE_UPDATED: 'Cập nhật ghi chú',
  GUIDE_ASSIGNED: 'Phân công hướng dẫn viên',
  GUIDE_CHANGED: 'Thay đổi hướng dẫn viên',
  ADMIN_INTERVENTION: 'Can thiệp quản trị',
};

export function formatDateTimeVN(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeVN(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateVN(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Ước tính ngày kết thúc từ ngày khởi hành + chuỗi duration (VD: "3 Ngày 2 Đêm")
 */
export function computeExpectedEndDate(startDate, durationStr) {
  if (!startDate) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;
  const match = String(durationStr || '').match(/(\d+)\s*ngày/i);
  const days = match ? Math.max(1, parseInt(match[1], 10)) : 1;
  return new Date(d.getTime() + (days - 1) * 24 * 3600 * 1000);
}

