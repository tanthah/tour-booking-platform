export const PHOTO_CATEGORY_META = {
  GROUP: { label: 'Ảnh tập thể đoàn', color: '#2563eb', bg: '#eff6ff' },
  LOCATION: { label: 'Địa điểm tham quan', color: '#059669', bg: '#ecfdf5' },
  ACTIVITY: { label: 'Hoạt động trải nghiệm', color: '#d97706', bg: '#fffbeb' },
  PERSONAL: { label: 'Ảnh riêng hành khách', color: '#7c3aed', bg: '#f5f3ff' },
};

export const CARD_STATUS_META = {
  DRAFT: { label: 'Bản nháp', type: 'default', color: '#64748b' },
  PENDING_REVIEW: { label: 'Chờ duyệt', type: 'warning', color: '#f59e0b' },
  REVISION_REQUESTED: { label: 'Yêu cầu sửa', type: 'danger', color: '#ef4444' },
  APPROVED: { label: 'Đã duyệt', type: 'info', color: '#3b82f6' },
  PUBLISHED: { label: 'Đã phát hành', type: 'success', color: '#10b981' },
  REVOKED: { label: 'Đã thu hồi', type: 'secondary', color: '#94a3b8' },
};

export const EMAIL_STATUS_META = {
  NOT_SENT: { label: 'Chưa gửi', color: '#94a3b8' },
  SENDING: { label: 'Đang gửi...', color: '#f59e0b' },
  SENT: { label: 'Đã gửi', color: '#10b981' },
  FAILED: { label: 'Gửi lỗi', color: '#ef4444' },
  NO_EMAIL: { label: 'Không có email', color: '#64748b' },
};

