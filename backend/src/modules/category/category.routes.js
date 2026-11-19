const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  listCategoriesValidation,
} = require('./category.validation');

// ============ PROTECTED ROUTES — ADMIN/STAFF quản lý Danh mục ============

// Endpoint lấy danh sách danh mục đang hoạt động (dùng cho dropdown chọn danh mục)
router.get('/active', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), categoryController.getActiveCategories);

// Endpoint lấy danh sách tất cả danh mục (có phân trang, lọc, tìm kiếm)
router.get('/', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), listCategoriesValidation, categoryController.getAllCategories);

// Endpoint tạo danh mục mới
router.post('/', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), createCategoryValidation, categoryController.createCategory);

// Endpoint lấy chi tiết danh mục theo ID
router.get('/:id', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), categoryIdValidation, categoryController.getCategoryById);

// Endpoint cập nhật thông tin danh mục
router.put('/:id', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), updateCategoryValidation, categoryController.updateCategory);

// Endpoint xóa mềm danh mục
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), categoryIdValidation, categoryController.deleteCategory);

module.exports = router;

