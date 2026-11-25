/**
 * Định dạng thời gian tương đối thân thiện (VD: "Vừa xong", "5 phút trước", "2 giờ trước")
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  // Quá 7 ngày hiển thị ngày/tháng/năm
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Cấu hình style, màu sắc và icon theo từng loại sự kiện
 */
export const getEventBadge = (eventType) => {
  switch (eventType) {
    case 'ORDER_CREATED':
      return {
        label: 'Đơn hàng mới',
        bg: '#fff7ed',
        color: '#ea580c',
        borderColor: '#fed7aa',
        iconName: 'Package',
      };
    case 'PAYMENT_SUCCESS':
      return {
        label: 'Thanh toán',
        bg: '#f0fdf4',
        color: '#16a34a',
        borderColor: '#bbf7d0',
        iconName: 'CheckCircle2',
      };
    case 'CANCEL_REQUESTED':
      return {
        label: 'Yêu cầu hủy',
        bg: '#fefce8',
        color: '#ca8a04',
        borderColor: '#fef08a',
        iconName: 'Clock',
      };
    case 'CANCEL_APPROVED':
      return {
        label: 'Hủy được duyệt',
        bg: '#eff6ff',
        color: '#2563eb',
        borderColor: '#bfdbfe',
        iconName: 'CheckCheck',
      };
    case 'CANCEL_REJECTED':
      return {
        label: 'Hủy bị từ chối',
        bg: '#fef2f2',
        color: '#dc2626',
        borderColor: '#fecaca',
        iconName: 'AlertCircle',
      };
    case 'REFUND_SUCCESS':
      return {
        label: 'Hoàn tiền',
        bg: '#ecfdf5',
        color: '#059669',
        borderColor: '#a7f3d0',
        iconName: 'CreditCard',
      };
    case 'DEPARTURE_CHANGED':
      return {
        label: 'Lịch khởi hành',
        bg: '#fff7ed',
        color: '#ea580c',
        borderColor: '#fed7aa',
        iconName: 'Calendar',
      };
    case 'DEPARTURE_CANCELLED':
      return {
        label: 'Chuyến đi bị hủy',
        bg: '#fef2f2',
        color: '#dc2626',
        borderColor: '#fecaca',
        iconName: 'AlertCircle',
      };
    case 'MEETING_POINT_CHANGED':
      return {
        label: 'Điểm tập trung',
        bg: '#f0f9ff',
        color: '#0284c7',
        borderColor: '#bae6fd',
        iconName: 'MapPin',
      };
    case 'CARD_PUBLISHED':
      return {
        label: 'Thiệp kỷ niệm',
        bg: '#faf5ff',
        color: '#9333ea',
        borderColor: '#e9d5ff',
        iconName: 'Sparkles',
      };
    default:
      return {
        label: 'Thông báo',
        bg: '#f8fafc',
        color: '#64748b',
        borderColor: '#e2e8f0',
        iconName: 'Bell',
      };
  }
};
