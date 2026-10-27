const { validationResult } = require('express-validator');
const articleCategoryService = require('./articleCategory.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
    return false;
  }
  return true;
};

const getAllCategories = asyncHandler(async (req, res) => {
  const result = await articleCategoryService.getAllCategories(req.query);
  ApiResponse.success(res, 200, 'Lấy danh sách danh mục thành công', result);
});

const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await articleCategoryService.getActiveCategories();
  ApiResponse.success(res, 200, 'Lấy danh sách danh mục hoạt động thành công', categories);
});

const getCategoryById = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const category = await articleCategoryService.getCategoryById(req.params.id);
  ApiResponse.success(res, 200, 'Lấy chi tiết danh mục thành công', category);
});

const createCategory = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const category = await articleCategoryService.createCategory(req.body);
  ApiResponse.success(res, 201, 'Tạo danh mục tin tức thành công', category);
});

const updateCategory = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const category = await articleCategoryService.updateCategory(req.params.id, req.body);
  ApiResponse.success(res, 200, 'Cập nhật danh mục thành công', category);
});

const toggleCategoryStatus = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const category = await articleCategoryService.toggleCategoryStatus(req.params.id, req.body.is_active);
  ApiResponse.success(res, 200, 'Thay đổi trạng thái danh mục thành công', category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  await articleCategoryService.deleteCategory(req.params.id);
  ApiResponse.success(res, 200, 'Xóa danh mục thành công');
});

module.exports = {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
};
