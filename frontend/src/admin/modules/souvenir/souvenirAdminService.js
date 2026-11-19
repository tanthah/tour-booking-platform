import axiosAdmin from '../../config/axiosAdmin';

// ============ ĐỢT KHỞI HÀNH & ALBUM ============
export const getCompletedDepartures = (params = {}) =>
  axiosAdmin.get('/souvenirs/departures', { params });

export const createAlbum = (data) =>
  axiosAdmin.post('/souvenirs/albums', data);

export const getAlbumDetail = (albumId) =>
  axiosAdmin.get(`/souvenirs/albums/${albumId}`);

export const updateAlbum = (albumId, data) =>
  axiosAdmin.put(`/souvenirs/albums/${albumId}`, data);

export const getDepartureCustomers = (albumId) =>
  axiosAdmin.get(`/souvenirs/albums/${albumId}/customers`);

// ============ QUẢN LÝ ẢNH ============
export const getAlbumPhotos = (albumId, params = {}) =>
  axiosAdmin.get(`/souvenirs/albums/${albumId}/photos`, { params });

export const uploadAlbumPhotos = (albumId, formData) =>
  axiosAdmin.post(`/souvenirs/albums/${albumId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updatePhoto = (photoId, data) =>
  axiosAdmin.put(`/souvenirs/albums/photos/${photoId}`, data);

export const deletePhoto = (photoId, force = false) =>
  axiosAdmin.delete(`/souvenirs/albums/photos/${photoId}`, {
    params: { force },
  });

export const assignPhotoToCustomers = (photoId, assignments) =>
  axiosAdmin.post(`/souvenirs/albums/photos/${photoId}/assign`, { assignments });

export const removePhotoAssignment = (photoId, bookingCustomerId) =>
  axiosAdmin.delete(`/souvenirs/albums/photos/${photoId}/assign`, {
    data: { booking_customer_id: bookingCustomerId },
  });

// ============ BIÊN TẬP & XỬ LÝ THIỆP (STAFF) ============
export const getAlbumCards = (albumId, params = {}) =>
  axiosAdmin.get(`/souvenirs/albums/${albumId}/cards`, { params });

export const createCard = (data) =>
  axiosAdmin.post('/souvenirs/cards', data);

export const batchCreateCards = (albumId) =>
  axiosAdmin.post(`/souvenirs/albums/${albumId}/cards/batch`);

export const getCardDetail = (cardId) =>
  axiosAdmin.get(`/souvenirs/cards/${cardId}`);

export const updateCard = (cardId, data) =>
  axiosAdmin.put(`/souvenirs/cards/${cardId}`, data);

export const previewCard = (cardId) =>
  axiosAdmin.get(`/souvenirs/cards/${cardId}/preview`);

export const submitCardReview = (cardId) =>
  axiosAdmin.post(`/souvenirs/cards/${cardId}/submit-review`);

export const batchSubmitCardReview = (albumId) =>
  axiosAdmin.post(`/souvenirs/albums/${albumId}/cards/submit-review`);

// ============ ADMIN DUYỆT & PHÁT HÀNH ============
export const getPendingReviews = (params = {}) =>
  axiosAdmin.get('/souvenirs/admin/pending-reviews', { params });

export const approveCard = (cardId, comment = '') =>
  axiosAdmin.post(`/souvenirs/cards/${cardId}/approve`, { comment });

export const requestRevision = (cardId, reason) =>
  axiosAdmin.post(`/souvenirs/cards/${cardId}/request-revision`, { reason });

export const publishCard = (cardId) =>
  axiosAdmin.post(`/souvenirs/cards/${cardId}/publish`);

export const batchPublish = (albumId) =>
  axiosAdmin.post(`/souvenirs/albums/${albumId}/cards/publish`);

export const revokeCard = (cardId, reason) =>
  axiosAdmin.post(`/souvenirs/cards/${cardId}/revoke`, { reason });

export const resendCardEmail = (cardId) =>
  axiosAdmin.post(`/souvenirs/cards/${cardId}/resend-email`);

export const getCardEmailLogs = (cardId) =>
  axiosAdmin.get(`/souvenirs/cards/${cardId}/email-logs`);

