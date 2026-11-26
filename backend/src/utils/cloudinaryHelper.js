const { uploadToCloudinary, deleteFromCloudinary } = require('../middlewares/upload.middleware');

/**
 * Trích xuất public_id từ URL ảnh Cloudinary.
 * Hỗ trợ URL có version (v123456/...) và có/không có transformation.
 * Trả về null nếu không phải URL Cloudinary hợp lệ.
 *
 * @param {string} url - URL ảnh
 * @returns {string|null} public_id trên Cloudinary hoặc null
 */
const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes('cloudinary.com')) return null;

  try {
    const cleanUrl = trimmed.split('?')[0].split('#')[0];
    const uploadMarker = '/upload/';
    const markerIndex = cleanUrl.indexOf(uploadMarker);
    if (markerIndex === -1) return null;

    let pathAfterUpload = cleanUrl.slice(markerIndex + uploadMarker.length);
    if (!pathAfterUpload) return null;

    const segments = pathAfterUpload.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    // Nếu có segment version dạng v1234567890 -> public_id bắt đầu ngay sau segment đó
    const versionIdx = segments.findIndex((seg) => /^v\d+$/.test(seg));
    let publicSegments = [];
    if (versionIdx !== -1 && versionIdx < segments.length - 1) {
      publicSegments = segments.slice(versionIdx + 1);
    } else {
      // Không có version: bỏ qua các segment transformation (chứa dấu ',' hoặc prefix transform phổ biến)
      let startIdx = 0;
      while (
        startIdx < segments.length - 1 &&
        (segments[startIdx].includes(',') ||
          /^(w|h|c|q|f|e|g|r|b|bo|dpr|fl|l|o|t|u|x|y|z)_[^/]+$/.test(segments[startIdx]))
      ) {
        startIdx += 1;
      }
      publicSegments = segments.slice(startIdx);
    }

    if (publicSegments.length === 0) return null;

    // Bỏ phần mở rộng file ở segment cuối
    const lastIdx = publicSegments.length - 1;
    publicSegments[lastIdx] = publicSegments[lastIdx].replace(/\.[^/.]+$/, '');

    const publicId = decodeURIComponent(publicSegments.join('/'));
    return publicId || null;
  } catch {
    return null;
  }
};

/**
 * Xác định public_id từ explicitPublicId hoặc suy ra từ URL Cloudinary.
 *
 * @param {string|null} url - URL ảnh
 * @param {string|null} explicitPublicId - public_id lưu trong DB
 * @returns {string|null}
 */
const resolvePublicId = (url, explicitPublicId = null) => {
  if (explicitPublicId && typeof explicitPublicId === 'string' && explicitPublicId.trim()) {
    return explicitPublicId.trim();
  }
  return extractPublicIdFromUrl(url);
};

/**
 * Xóa an toàn một ảnh trên Cloudinary theo public_id hoặc URL Cloudinary.
 * Không ném lỗi ra ngoài để tránh làm gián đoạn luồng cập nhật DB chính.
 *
 * @param {string|null} publicIdOrUrl - public_id hoặc URL Cloudinary
 * @returns {Promise<object>}
 */
const safeDeleteFromCloudinary = async (publicIdOrUrl) => {
  if (!publicIdOrUrl || typeof publicIdOrUrl !== 'string') {
    return { skipped: true };
  }

  const trimmed = publicIdOrUrl.trim();
  if (!trimmed) {
    return { skipped: true };
  }

  const publicId = /^https?:\/\//i.test(trimmed)
    ? extractPublicIdFromUrl(trimmed)
    : trimmed;

  if (!publicId) {
    return { skipped: true };
  }

  try {
    const result = await deleteFromCloudinary(publicId);
    return { deleted: true, publicId, result };
  } catch (error) {
    console.error(`[CloudinaryHelper] Không thể xóa ảnh "${publicId}":`, error.message);
    return { deleted: false, publicId, error: error.message };
  }
};

/**
 * Xóa hàng loạt ảnh trên Cloudinary (bỏ qua phần tử rỗng và trùng lặp).
 *
 * @param {Array<string>} publicIdsOrUrls - Danh sách public_id hoặc URL Cloudinary
 * @returns {Promise<Array<object>>}
 */
const deleteImages = async (publicIdsOrUrls = []) => {
  if (!Array.isArray(publicIdsOrUrls) || publicIdsOrUrls.length === 0) {
    return [];
  }

  const uniqueTargets = new Set();
  for (const item of publicIdsOrUrls) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const resolved = /^https?:\/\//i.test(trimmed)
      ? extractPublicIdFromUrl(trimmed)
      : trimmed;
    if (resolved) {
      uniqueTargets.add(resolved);
    }
  }

  if (uniqueTargets.size === 0) return [];

  const results = await Promise.allSettled(
    Array.from(uniqueTargets).map((publicId) => safeDeleteFromCloudinary(publicId))
  );

  return results.map((r) => (r.status === 'fulfilled' ? r.value : { deleted: false }));
};

/**
 * Upload ảnh mới lên Cloudinary, sau đó xóa ảnh cũ (nếu có).
 * Luôn upload ảnh mới trước để đảm bảo không mất ảnh nếu upload lỗi.
 *
 * @param {Buffer} fileBuffer - Buffer file ảnh mới
 * @param {string} folder - Thư mục lưu trên Cloudinary
 * @param {string|null} oldPublicIdOrUrl - public_id hoặc URL ảnh cũ cần xóa
 * @returns {Promise<{url: string, public_id: string, result: object}>}
 */
const replaceImage = async (fileBuffer, folder = 'tour-booking', oldPublicIdOrUrl = null) => {
  const result = await uploadToCloudinary(fileBuffer, folder);

  if (oldPublicIdOrUrl) {
    const oldId = /^https?:\/\//i.test(oldPublicIdOrUrl)
      ? extractPublicIdFromUrl(oldPublicIdOrUrl)
      : oldPublicIdOrUrl.trim();

    if (oldId && oldId !== result.public_id) {
      await safeDeleteFromCloudinary(oldId);
    }
  }

  return {
    url: result.secure_url,
    public_id: result.public_id,
    result,
  };
};

/**
 * Chuẩn hóa 1 entry ảnh về dạng { url, publicId }.
 */
const normalizeImageEntry = (entry) => {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    const isUrl = /^https?:\/\//i.test(trimmed);
    return {
      url: isUrl ? trimmed : '',
      publicId: isUrl ? extractPublicIdFromUrl(trimmed) : trimmed,
    };
  }
  if (typeof entry === 'object') {
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    const explicitId = typeof entry.public_id === 'string' ? entry.public_id.trim() : '';
    const publicId = resolvePublicId(url, explicitId);
    if (!url && !publicId) return null;
    return { url, publicId };
  }
  return null;
};

/**
 * So sánh danh sách ảnh cũ và ảnh mới, tự động xóa trên Cloudinary những ảnh cũ không còn được sử dụng.
 *
 * @param {Array<string|{url?: string, public_id?: string}>} oldEntries - Danh sách ảnh trước khi cập nhật
 * @param {Array<string|{url?: string, public_id?: string}>} newEntries - Danh sách ảnh sau khi cập nhật
 * @returns {Promise<Array<object>>}
 */
const cleanupRemovedImages = async (oldEntries = [], newEntries = []) => {
  const normalizedOld = (Array.isArray(oldEntries) ? oldEntries : [oldEntries])
    .map(normalizeImageEntry)
    .filter(Boolean);

  if (normalizedOld.length === 0) return [];

  const normalizedNew = (Array.isArray(newEntries) ? newEntries : [newEntries])
    .map(normalizeImageEntry)
    .filter(Boolean);

  const newPublicIds = new Set(normalizedNew.map((e) => e.publicId).filter(Boolean));
  const newUrls = new Set(normalizedNew.map((e) => e.url).filter(Boolean));

  const toDelete = [];
  for (const oldItem of normalizedOld) {
    if (!oldItem.publicId) continue;
    const stillUsedById = newPublicIds.has(oldItem.publicId);
    const stillUsedByUrl = oldItem.url && newUrls.has(oldItem.url);
    if (!stillUsedById && !stillUsedByUrl) {
      toDelete.push(oldItem.publicId);
    }
  }

  return deleteImages(toDelete);
};

module.exports = {
  extractPublicIdFromUrl,
  resolvePublicId,
  safeDeleteFromCloudinary,
  deleteImages,
  replaceImage,
  cleanupRemovedImages,
};
