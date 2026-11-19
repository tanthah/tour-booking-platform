import axiosClient from '../../config/axiosClient';

// ============ API KHÁCH HÀNG THIỆP KỶ NIỆM ============

/**
 * Lấy danh sách thiệp điện tử của tôi
 */
export const getMyCards = (params = {}) =>
  axiosClient.get('/souvenirs/my-cards', { params });

/**
 * Lấy chi tiết thiệp kỷ niệm (theo ID hoặc public_code)
 */
export const getMyCardDetail = (identifier) =>
  axiosClient.get(`/souvenirs/my-cards/${identifier}`);

/**
 * Lấy danh sách ảnh album chung của đoàn
 */
export const getMyCardSharedAlbum = (identifier, params = {}) =>
  axiosClient.get(`/souvenirs/my-cards/${identifier}/album`, { params });

/**
 * Lấy link tải 1 ảnh
 */
export const getPhotoDownload = (photoId) =>
  axiosClient.get(`/souvenirs/photos/${photoId}/download`);

/**
 * Link tải toàn bộ album dạng ZIP (yêu cầu Bearer token hoặc tải trực tiếp với stream)
 */
export const downloadAlbumZip = async (identifier) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/souvenirs/my-cards/${identifier}/download-album`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Không thể tải tệp nén ZIP của album');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TourGo_Album_${identifier}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

