const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo Danh mục mới (Create Category Validation Schema)
 */
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên danh mục là bắt buộc')
    .isLength({ min: 2, max: 100 }).withMessage('Tên danh mục phải từ 2 đến 100 ký tự'),

  body('parent_id')
    .optional({ values: 'null' })
    .isMongoId().withMessage('ID danh mục cha không hợp lệ'),

  body('position')
    .optional()
    .isInt({ min: 0 }).withMessage('Vị trí phải là số nguyên >= 0'),

  body('image')
    .optional()
    .isString().withMessage('Ảnh đại diện phải là chuỗi URL'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trang thái phải là ACTIVE hoặc INACTIVE'),
];

/**
 * Validation rules cho việc cập nhật Danh mục (Update Category Validation Schema)
 * Tất cả các trường đều optional, chỉ validate giá trị nếu được gửi lên
 */
const updateCategoryValidation = [
  param('id')
    .isMongoId().withMessage('ID danh mục không hợp lệ'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Tên danh mục phải từ 2 đến 100 ký tự'),

  body('parent_id')
    .optional({ values: 'null' })
    .isMongoId().withMessage('ID danh mục cha không hợp lệ'),

  body('position')
    .optional()
    .isInt({ min: 0 }).withMessage('Vị trí phải là số nguyên >= 0'),

  body('image')
    .optional()
    .isString().withMessage('Ảnh đại diện phải là chuỗi URL'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trạng thái phải là ACTIVE hoặc INACTIVE'),
];

/**
 * Validation rules cho param ID Danh mục
 */
const categoryIdValidation = [
  param('id')
    .isMongoId().withMessage('ID danh mục không hợp lệ'),
];

/**
 * Validation rules cho query params tìm kiếm / lọc danh sách Danh mục
 */
const listCategoriesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Trang phải là số nguyên >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Số lượng mỗi trang từ 1 đến 50'),

  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Trạng thái không hợp lệ'),

  query('sort')
    .optional()
    .isIn(['name_asc', 'name_desc', 'position', 'newest'])
    .withMessage('Sắp xếp không hợp lệ'),
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  listCategoriesValidation,
};

