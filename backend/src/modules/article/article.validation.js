const { body, param, query } = require('express-validator');

/**
 * Validation rules cho Article & ArticleCategory
 */

const createArticleValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề bài viết không được để trống')
    .isLength({ max: 255 })
    .withMessage('Tiêu đề không quá 255 ký tự'),
  body('category_id')
    .notEmpty()
    .withMessage('Danh mục bài viết là bắt buộc')
    .isMongoId()
    .withMessage('ID danh mục không hợp lệ'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 600 })
    .withMessage('Tóm tắt không quá 600 ký tự'),
  body('content_source_type')
    .optional()
    .isIn(['original', 'curated'])
    .withMessage('Loại nguồn bài viết phải là original hoặc curated'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'])
    .withMessage('Trạng thái bài viết không hợp lệ'),
];

const updateArticleValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề bài viết không được để trống')
    .isLength({ max: 255 })
    .withMessage('Tiêu đề không quá 255 ký tự'),
  body('category_id')
    .optional()
    .isMongoId()
    .withMessage('ID danh mục không hợp lệ'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 600 })
    .withMessage('Tóm tắt không quá 600 ký tự'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'])
    .withMessage('Trạng thái bài viết không hợp lệ'),
];

const requestChangesValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập lý do / nhận xét yêu cầu chỉnh sửa')
    .isLength({ max: 1000 })
    .withMessage('Nhận xét không được vượt quá 1000 ký tự'),
];

const assignValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ'),
  body('assigned_to')
    .notEmpty()
    .withMessage('Vui lòng chọn nhân viên được phân công')
    .isMongoId()
    .withMessage('ID nhân viên không hợp lệ'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú phân công không vượt quá 500 ký tự'),
];

const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên danh mục không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên danh mục không quá 100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả danh mục không quá 500 ký tự'),
];

const updateCategoryValidation = [
  param('id').isMongoId().withMessage('ID danh mục không hợp lệ'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tên danh mục không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên danh mục không quá 100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả danh mục không quá 500 ký tự'),
];

const idParamValidation = [
  param('id').isMongoId().withMessage('ID không hợp lệ'),
];

const listArticlesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng mỗi trang từ 1 đến 100'),
];

module.exports = {
  createArticleValidation,
  updateArticleValidation,
  requestChangesValidation,
  assignValidation,
  createCategoryValidation,
  updateCategoryValidation,
  idParamValidation,
  listArticlesValidation,
};
