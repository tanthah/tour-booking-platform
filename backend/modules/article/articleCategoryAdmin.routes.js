const express = require('express');
const router = express.Router();
const articleCategoryController = require('./articleCategory.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  createCategoryValidation,
  updateCategoryValidation,
  idParamValidation,
} = require('./article.validation');

// Bảo vệ toàn bộ endpoints quản lý danh mục bài viết bằng quyền ARTICLE_CATEGORY_MANAGE
router.use(authenticate, requirePermission(PERMISSIONS.ARTICLE_CATEGORY_MANAGE));

// Lấy danh sách tất cả danh mục (có lọc, phân trang)
router.get('/', articleCategoryController.getAllCategories);

// Lấy danh sách danh mục đang hoạt động (dùng cho dropdown)
router.get('/active', articleCategoryController.getActiveCategories);

// Lấy chi tiết danh mục theo ID
router.get('/:id', idParamValidation, articleCategoryController.getCategoryById);

// Tạo danh mục mới
router.post('/', createCategoryValidation, articleCategoryController.createCategory);

// Cập nhật danh mục
router.put('/:id', updateCategoryValidation, articleCategoryController.updateCategory);

// Bật / tắt trạng thái hoạt động của danh mục
router.patch('/:id/status', idParamValidation, articleCategoryController.toggleCategoryStatus);

// Xóa danh mục
router.delete('/:id', idParamValidation, articleCategoryController.deleteCategory);

module.exports = router;
