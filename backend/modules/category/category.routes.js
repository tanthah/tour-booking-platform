const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  listCategoriesValidation,
} = require('./category.validation');

// ============ PROTECTED ROUTES — ADMIN/STAFF quản lý Danh mục ============

// Endpoint lấy danh sách danh mục đang hoạt động (dùng cho dropdown chọn danh mục)
router.get('/active', authenticate, authorize('ADMIN', 'STAFF'), categoryController.getActiveCategories);

// Endpoint lấy danh sách tất cả danh mục (có phân trang, lọc, tìm kiếm)
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), listCategoriesValidation, categoryController.getAllCategories);

// Endpoint tạo danh mục mới
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), createCategoryValidation, categoryController.createCategory);

// Endpoint lấy chi tiết danh mục theo ID
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), categoryIdValidation, categoryController.getCategoryById);

// Endpoint cập nhật thông tin danh mục
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateCategoryValidation, categoryController.updateCategory);

// Endpoint xóa mềm danh mục
router.delete('/:id', authenticate, authorize('ADMIN', 'STAFF'), categoryIdValidation, categoryController.deleteCategory);

module.exports = router;

