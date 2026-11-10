/**
 * Utility tạo slug tiếng Việt thân thiện với SEO
 */

const slugify = (text = '') => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Tạo slug duy nhất cho một model bằng cách thêm hậu tố số nếu trùng
 * @param {object} Model - Mongoose Model
 * @param {string} text - Tiêu đề cần tạo slug
 * @param {string|null} currentId - ID tài liệu hiện tại (nếu đang cập nhật)
 */
const createUniqueSlug = async (Model, text, currentId = null) => {
  const baseSlug = slugify(text) || 'bai-viet';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const existing = await Model.findOne(query).select('_id').lean();
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

module.exports = { slugify, createUniqueSlug };
